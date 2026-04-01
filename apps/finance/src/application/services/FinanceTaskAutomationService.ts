import { FinanceRepository, type FinanceTaskRecord } from '../../domain/repository.js';
import type { FinanceTaskType, FinancePrediction } from '../../domain/models.js';
import {
  DurableFinanceQueueAdapter,
  InMemoryFinanceQueueAdapter,
  type FinanceQueueAdapter
} from '../../infrastructure/adapters/FinanceQueueAdapter.js';
import {
  DurableFinanceSchedulerAdapter,
  InMemoryFinanceSchedulerAdapter,
  type FinanceSchedulerAdapter
} from '../../infrastructure/adapters/FinanceSchedulerAdapter.js';
import { FinanceAppOrchestratorService } from './FinanceAppOrchestratorService.js';
import { FinanceReviewService } from '../reviews/FinanceReviewService.js';
import { FinanceErrorIntelligenceService } from '../error-intelligence/FinanceErrorIntelligenceService.js';
import { FinanceArtifactService } from '../artifacts/FinanceArtifactService.js';
import { FinancePredictionService } from '../predictions/FinancePredictionService.js';
import { FinanceEvaluationService } from '../evaluation/FinanceEvaluationService.js';
import { FinanceRuntimeSettingsService } from './FinanceRuntimeSettingsService.js';

export class FinanceTaskAutomationService {
  private readonly orchestrator: FinanceAppOrchestratorService;
  private readonly reviewService: FinanceReviewService;
  private readonly errorService: FinanceErrorIntelligenceService;
  private readonly artifactService: FinanceArtifactService;
  private readonly predictionService: FinancePredictionService;
  private readonly evaluationService: FinanceEvaluationService;
  private readonly runtimeSettingsService: FinanceRuntimeSettingsService;

  constructor(
    private readonly repo = new FinanceRepository(),
    private readonly queue: FinanceQueueAdapter = new DurableFinanceQueueAdapter(repo),
    private readonly scheduler: FinanceSchedulerAdapter = new DurableFinanceSchedulerAdapter(repo)
  ) {
    this.orchestrator = new FinanceAppOrchestratorService(repo);
    this.reviewService = new FinanceReviewService(repo);
    this.errorService = new FinanceErrorIntelligenceService(repo);
    this.artifactService = new FinanceArtifactService(repo);
    this.predictionService = new FinancePredictionService(repo);
    this.evaluationService = new FinanceEvaluationService(repo);
    this.runtimeSettingsService = new FinanceRuntimeSettingsService(repo);
  }

  static inMemory(repo = new FinanceRepository()): FinanceTaskAutomationService {
    return new FinanceTaskAutomationService(repo, new InMemoryFinanceQueueAdapter(), new InMemoryFinanceSchedulerAdapter());
  }

  async enqueue(taskType: FinanceTaskType, payload: Record<string, unknown>, source: FinanceTaskRecord['source']): Promise<FinanceTaskRecord> {
    const idempotencyKey = `${taskType}:${JSON.stringify(payload)}`;
    const existing = this.repo
      .listTasks({ limit: 1000 })
      .find((x) => x.idempotencyKey === idempotencyKey && ['queued', 'running', 'pending'].includes(x.status));
    if (existing) return existing;

    const task: FinanceTaskRecord = {
      id: `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      taskType,
      status: 'queued',
      scheduledAt: undefined,
      retryCount: 0,
      source,
      idempotencyKey,
      refs: {
        runtimeDefaults: this.runtimeSettingsService.mapTaskDefaults(taskType)
      },
      payload,
      createdAt: new Date().toISOString()
    };
    this.repo.saveTask(task);
    await this.queue.enqueue({ id: `msg-${task.id}`, taskId: task.id, taskType: task.taskType, payload, source, enqueuedAt: new Date().toISOString() });
    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}`, metricKey: 'queued_task_count', metricValue: 1, meta: { taskType }, createdAt: new Date().toISOString() });
    if (source === 'manual') this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-manual`, metricKey: 'manual_run_count', metricValue: 1, meta: {}, createdAt: new Date().toISOString() });
    return task;
  }

  async schedule(taskType: FinanceTaskType, runAt: string, payload: Record<string, unknown>): Promise<void> {
    await this.scheduler.register({ id: `sched-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, taskType, runAt, payload, source: 'schedule' });
    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-sched`, metricKey: 'scheduled_run_count', metricValue: 1, meta: { taskType }, createdAt: new Date().toISOString() });
  }

  async pollScheduled(now = new Date()): Promise<number> {
    const due = await this.scheduler.due(now);
    for (const task of due) {
      const enqueued = await this.enqueue(task.taskType as FinanceTaskType, task.payload, 'schedule');
      enqueued.scheduledAt = task.runAt;
      this.repo.saveTask(enqueued);
    }
    return due.length;
  }

  async recoverStaleRunningTasks(now = new Date()): Promise<number> {
    const stale = this.repo
      .listTasks({ status: 'running', limit: 500 })
      .filter((task) => task.startedAt && now.getTime() - new Date(task.startedAt).getTime() > 60_000);
    stale.forEach((task) => {
      task.status = 'failed';
      task.errorSummary = 'stale_running_task_detected';
      task.lastErrorAt = now.toISOString();
      task.finishedAt = now.toISOString();
      task.nextRetryAt = new Date(now.getTime() + 30_000).toISOString();
      this.repo.saveTask(task);
    });
    return stale.length;
  }

  async runNext(): Promise<FinanceTaskRecord | undefined> {
    await this.recoverStaleRunningTasks();
    const message = await this.queue.dequeue();
    if (!message) return undefined;
    const task = this.repo.getTask(message.taskId);
    if (!task || task.status === 'cancelled') {
      await this.queue.ack(message.id, message.claimToken);
      return task;
    }

    task.status = 'running';
    task.startedAt = new Date().toISOString();
    this.repo.saveTask(task);
    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-running`, metricKey: 'running_task_count', metricValue: 1, meta: { taskType: task.taskType }, createdAt: new Date().toISOString() });

    try {
      await this.execute(task);
      task.status = 'succeeded';
      task.finishedAt = new Date().toISOString();
      this.repo.saveTask(task);
      await this.queue.ack(message.id, message.claimToken);
      this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-success`, metricKey: 'task_success_rate', metricValue: 1, meta: {}, createdAt: new Date().toISOString() });
    } catch (error) {
      task.status = 'failed';
      task.errorSummary = error instanceof Error ? error.message : String(error);
      task.lastErrorAt = new Date().toISOString();
      task.nextRetryAt = new Date(Date.now() + (task.retryCount + 1) * 60_000).toISOString();
      task.finishedAt = new Date().toISOString();
      this.repo.saveTask(task);
      await this.queue.fail(message.id, message.claimToken);
      this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-failed`, metricKey: 'failed_task_count', metricValue: 1, meta: { taskType: task.taskType }, createdAt: new Date().toISOString() });
    }

    return task;
  }

  async retry(taskId: string): Promise<FinanceTaskRecord | undefined> {
    const task = this.repo.getTask(taskId);
    if (!task || task.status !== 'failed') return task;
    task.status = 'queued';
    task.retryCount += 1;
    task.errorSummary = undefined;
    task.nextRetryAt = undefined;
    this.repo.saveTask(task);
    await this.queue.enqueue({ id: `msg-retry-${task.id}-${task.retryCount}`, taskId: task.id, taskType: task.taskType, payload: task.payload, source: task.source, enqueuedAt: new Date().toISOString() });
    this.repo.recordMetric({ id: `m-${Date.now().toString(36)}-retry`, metricKey: 'retry_count', metricValue: 1, meta: { taskId }, createdAt: new Date().toISOString() });
    return task;
  }

  cancel(taskId: string): FinanceTaskRecord | undefined {
    const task = this.repo.getTask(taskId);
    if (!task || !['queued', 'pending'].includes(task.status)) return task;
    task.status = 'cancelled';
    task.finishedAt = new Date().toISOString();
    this.repo.saveTask(task);
    return task;
  }

  list(filters?: { status?: string; taskType?: string; limit?: number }): FinanceTaskRecord[] {
    return this.repo.listTasks(filters);
  }

  runCenterSummary(): Record<string, unknown> {
    return {
      ...this.repo.getRunCenterSummary(),
      queueSize: this.repo.listQueueRecords().filter((x) => x.status === 'queued').length,
      staleClaims: this.repo.listQueueRecords('claimed').filter((x) => x.leaseUntil && new Date(x.leaseUntil) <= new Date()).length,
      reviewRuns: this.repo.listPredictionReviewRuns().slice(0, 20)
    };
  }

  private async execute(task: FinanceTaskRecord): Promise<void> {
    if (task.taskType === 'daily_brief_generation' || task.taskType === 'weekly_portfolio_review') {
      const artifact = this.artifactService.generate({
        taskType: task.taskType,
        artifactType: task.taskType === 'daily_brief_generation' ? 'daily_brief' : 'weekly_review',
        title: String(task.payload.title ?? task.taskType),
        body: String(task.payload.body ?? 'scheduled task body'),
        ticker: task.payload.ticker ? String(task.payload.ticker) : undefined,
        evidence: ['task_automation']
      });
      task.refs = { artifactId: artifact.id };
      await this.enqueue('prediction_extraction', { artifactId: artifact.id }, 'replay');
      return;
    }

    if (task.taskType === 'prediction_extraction') {
      const artifactId = String(task.payload.artifactId ?? '');
      const artifact = this.repo.listArtifacts().find((x) => x.id === artifactId);
      if (!artifact) throw new Error('artifact_not_found_for_prediction_extraction');
      const extracted = this.predictionService.extractFromArtifact(artifact);
      task.refs = { artifactId, predictionIds: extracted.admitted.map((x) => x.id) };
      await this.enqueue('prediction_review', { triggerType: 'time_based', reviewWindowDays: 30 }, 'replay');
      return;
    }

    if (task.taskType === 'prediction_review') {
      const reviewWindowDays = Number(task.payload.reviewWindowDays ?? 30);
      const triggerType = String(task.payload.triggerType ?? 'time_based');
      const predictions = this.repo.listPredictions();
      const outcomes = this.repo.listOutcomes();
      const reviews = this.reviewService.listReviews();
      const now = new Date();

      const dueReviews = predictions.map((prediction) => this.resolveReviewDecision(prediction, outcomes, reviews, triggerType, reviewWindowDays, now));
      const createdReviews: string[] = [];
      for (const item of dueReviews) {
        if (item.decision !== 'review') continue;
        if (!item.outcome) continue;
        const review = this.reviewService.reviewPrediction(item.prediction, item.outcome);
        createdReviews.push(review.id);
        this.repo.savePredictionReviewRun({
          id: `review-run-${review.id}`,
          predictionId: item.prediction.id,
          triggerType: item.reason,
          outcomeId: item.outcome.id,
          runKey: `${item.prediction.id}:${item.outcome.id}`,
          createdAt: now.toISOString()
        });
        if (item.highImpact) {
          await this.enqueue('manual_review_requested', { predictionId: item.prediction.id, reviewId: review.id }, 'manual');
        }
      }
      task.refs = { reviewed: createdReviews, decisions: dueReviews.map((x) => ({ predictionId: x.prediction.id, decision: x.decision, reason: x.reason })) };
      await this.enqueue('error_pattern_scan', { windowDays: 30 }, 'replay');
      return;
    }

    if (task.taskType === 'error_pattern_scan') {
      const patterns = this.errorService.aggregatePatterns(this.reviewService.listReviews());
      task.refs = { patternIds: patterns.map((p) => p.id) };
      await this.enqueue('finance_candidate_generation', { patternIds: patterns.map((p) => p.id) }, 'replay');
      return;
    }

    if (task.taskType === 'finance_candidate_generation') {
      const patterns = this.repo.listPatterns();
      const proposals = await this.errorService.proposeSTUCandidates(patterns);
      task.refs = { candidateIds: proposals.map((x) => x.id) };
      await this.enqueue('finance_experiment_check', { candidateIds: proposals.map((x) => x.id) }, 'replay');
      return;
    }

    if (task.taskType === 'finance_experiment_check') {
      const reviews = this.reviewService.listReviews();
      const candidates = this.repo.listSTUProposals();
      const results = [];
      for (const candidate of candidates) {
        const result = await this.evaluationService.run(candidate, reviews, 'medium');
        results.push(result);
      }
      task.refs = { experimentResults: results };
      await this.enqueue('bias_snapshot_generation', { source: 'experiment' }, 'replay');
      return;
    }

    if (task.taskType === 'bias_snapshot_generation') {
      const predictions = this.repo.listPredictions();
      const outcomes = this.repo.listOutcomes();
      const reviews = this.repo.listReviews();
      const bullish = predictions.filter((x) => x.direction === 'bullish').length;
      const cautious = predictions.filter((x) => x.direction !== 'bullish').length;
      const confirmed = outcomes.filter((x) => x.outcomeLabel === 'confirmed').length;
      const rejected = outcomes.filter((x) => x.outcomeLabel === 'rejected').length;
      const confidenceAvg = predictions.length ? predictions.reduce((sum, x) => sum + x.confidence, 0) / predictions.length : 0;
      const snapshot = {
        behaviorSignals: {
          bullish_ratio: predictions.length ? bullish / predictions.length : 0,
          cautious_ratio: predictions.length ? cautious / predictions.length : 0,
          risk_alert_ratio: this.repo.listArtifacts().filter((x) => x.artifactType === 'risk_alert').length / Math.max(this.repo.listArtifacts().length, 1),
          avg_confidence_score: confidenceAvg
        },
        outcomeSignals: {
          bullish_accuracy: confirmed / Math.max(bullish, 1),
          cautious_accuracy: rejected / Math.max(cautious, 1),
          risk_alert_accuracy: confirmed / Math.max(this.repo.listArtifacts().filter((x) => x.artifactType === 'risk_alert').length, 1),
          confidence_calibration_score: 1 - reviews.filter((x) => x.confidenceIssue).length / Math.max(reviews.length, 1),
          missed_counterevidence_rate: reviews.filter((x) => x.evidenceIssue).length / Math.max(reviews.length, 1)
        }
      };
      this.repo.saveBiasSnapshot({
        id: `bias-auto-${Date.now().toString(36)}`,
        scopeKey: 'finance-system',
        payload: snapshot,
        createdAt: new Date().toISOString()
      });
      task.refs = { snapshot };
      await this.enqueue('timeline_rebuild', { reason: 'bias_snapshot_generation' }, 'replay');
      return;
    }

    if (task.taskType === 'timeline_rebuild') {
      const latestArtifact = this.repo.listArtifacts()[0];
      const latestPrediction = this.repo.listPredictions()[0];
      const latestReview = this.repo.listReviews()[0];
      const latestPattern = this.repo.listPatterns()[0];
      const latestCandidate = this.repo.listSTUProposals()[0];
      const latestReplay = this.repo.listSTUEffectReplays()[0];
      this.repo.saveTimelineLink({
        id: `tl-rebuild-${Date.now().toString(36)}`,
        ticker: latestPrediction?.ticker ?? latestArtifact?.ticker,
        reportId: latestArtifact?.id,
        predictionId: latestPrediction?.id,
        reviewId: latestReview?.id,
        errorPatternId: latestPattern?.id,
        candidateId: latestCandidate?.id,
        experimentId: latestReplay?.id,
        activeSTUEffect: latestReplay ? 'active_stu_effect_applied' : undefined,
        createdAt: new Date().toISOString()
      });
      task.refs = { rebuilt: true };
      return;
    }

    if (task.taskType === 'manual_review_requested') {
      task.refs = { manualQueue: true, reason: 'high_impact_or_manual_trigger' };
      return;
    }

    // fallback for older task types
    const result = await this.orchestrator.runMockTask({
      artifactType: 'daily_brief',
      title: String(task.payload.title ?? task.taskType),
      body: String(task.payload.body ?? 'fallback execution'),
      ticker: task.payload.ticker ? String(task.payload.ticker) : undefined,
      riskLevel: 'medium',
      activeSTUContext: []
    });
    task.refs = { artifactId: result.artifactId, reviewIds: result.reviewIds };
  }

  private resolveReviewDecision(
    prediction: FinancePrediction,
    outcomes: ReturnType<FinanceRepository['listOutcomes']>,
    reviews: ReturnType<FinanceReviewService['listReviews']>,
    triggerType: string,
    reviewWindowDays: number,
    now: Date
  ): { prediction: FinancePrediction; outcome?: ReturnType<FinanceRepository['listOutcomes']>[number]; decision: 'review' | 'skipped' | 'expired' | 'inconclusive'; reason: string; highImpact: boolean } {
    const predictionReviews = reviews.filter((x) => x.predictionId === prediction.id);
    if (predictionReviews.length > 0) {
      return { prediction, decision: 'skipped', reason: 'already_reviewed', highImpact: false };
    }
    const outcome = outcomes.find((x) => x.predictionId === prediction.id);
    const due = this.reviewService.shouldTriggerReview(prediction, now);
    const ageMs = now.getTime() - new Date(prediction.admittedAt).getTime();
    const reviewWindowMs = reviewWindowDays * 24 * 60 * 60 * 1000;
    const highImpact = prediction.confidence >= 0.9;

    if (triggerType === 'manual_review_requested') {
      if (!outcome) return { prediction, decision: 'inconclusive', reason: 'manual_without_outcome', highImpact };
      return { prediction, outcome, decision: 'review', reason: 'manual_review_requested', highImpact };
    }
    if (!due) return { prediction, decision: 'skipped', reason: 'not_due', highImpact };
    if (!outcome) {
      if (ageMs > reviewWindowMs) return { prediction, decision: 'expired', reason: 'review_window_expired', highImpact };
      return { prediction, decision: 'inconclusive', reason: 'outcome_missing', highImpact };
    }
    if (prediction.triggerType === 'event_based' && triggerType !== 'event_based') {
      return { prediction, decision: 'skipped', reason: 'event_based_requires_event_trigger', highImpact };
    }
    if (prediction.triggerType === 'time_based' && triggerType !== 'time_based') {
      return { prediction, decision: 'skipped', reason: 'time_based_requires_time_trigger', highImpact };
    }
    return { prediction, outcome, decision: 'review', reason: triggerType, highImpact };
  }
}
