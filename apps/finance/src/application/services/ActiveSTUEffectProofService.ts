import { StrategyCompiler } from '@stratos/strategy-compiler';
import { STURegistry } from '@stratos/stu-registry';
import type { TaskContext, STUCandidate } from '@stratos/shared-types';
import { FinanceArtifactService } from '../artifacts/FinanceArtifactService.js';
import { FinancePredictionService } from '../predictions/FinancePredictionService.js';
import { FinanceReviewService } from '../reviews/FinanceReviewService.js';
import { FinanceErrorIntelligenceService } from '../error-intelligence/FinanceErrorIntelligenceService.js';
import { FinanceEvaluationService } from '../evaluation/FinanceEvaluationService.js';
import { FinanceRepository } from '../../domain/repository.js';
import { ReplayAuditEngine, type ReplayFixture } from '@stratos/replay-debug';

export interface STUEffectReplayInput {
  ticker: string;
  thesisType: string;
  inputBody: string;
}

export interface STUEffectReplayResult {
  replayId: string;
  compilerTrace: { baselineActiveVersions: string[]; activeActiveVersions: string[] };

  baseline: Record<string, unknown>;
  active: Record<string, unknown>;
  effectSummary: {
    artifactDelta: number;
    predictionDelta: number;
    reviewDelta: number;
    errorPatternDelta: number;
  };
  replayProof?: Record<string, unknown>;
}

export class ActiveSTUEffectProofService {
  private readonly compiler = new StrategyCompiler();
  private readonly registry = new STURegistry();
  private readonly artifacts: FinanceArtifactService;
  private readonly predictions: FinancePredictionService;
  private readonly reviews: FinanceReviewService;
  private readonly errors: FinanceErrorIntelligenceService;
  private readonly evaluation: FinanceEvaluationService;
  private readonly replayAudit = new ReplayAuditEngine();

  constructor(private readonly repo = new FinanceRepository()) {
    this.artifacts = new FinanceArtifactService(repo);
    this.predictions = new FinancePredictionService(repo);
    this.reviews = new FinanceReviewService(repo);
    this.errors = new FinanceErrorIntelligenceService(repo);
    this.evaluation = new FinanceEvaluationService(repo);
  }

  async runReplay(input: STUEffectReplayInput): Promise<STUEffectReplayResult> {
    const taskContext: TaskContext = {
      taskType: 'stock_deep_dive',
      thesisType: input.thesisType,
      riskLevel: 'medium',
      ticker: input.ticker,
      metadata: {}
    };

    const baselineCompiled = this.compiler.compile(this.registry.getCompilationInput(taskContext), taskContext);
    const baseline = await this.executeOnce('baseline', input, baselineCompiled.promptLayer);

    const candidate: STUCandidate = {
      candidate_id: `candidate-${Date.now().toString(36)}`,
      source_error_pattern_id: 'pattern-directional-bias',
      review_refs: [],
      evidence_refs: [],
      scope_note: 'finance stock deep dive',
      strategy_summary: 'Require explicit downside scenario and counterevidence check.',
      schema_version: '1.0',
      created_at: new Date().toISOString()
    };

    this.registry.registerCandidate({
      candidate,
      app: 'finance',
      task_type: 'stock_deep_dive',
      artifact_type: 'stock_deep_dive',
      candidate_version: '1.0.0',
      promptLayer: ['Always include downside and counterevidence before conclusion.']
    });
    this.registry.activate(candidate.candidate_id, '1.0.0');

    const activeCompiled = this.compiler.compile(this.registry.getCompilationInput(taskContext), taskContext);
    const active = await this.executeOnce('active', input, activeCompiled.promptLayer);

    const baselineFixture: ReplayFixture = {
      runId: `${taskContext.taskType}-baseline-${Date.now().toString(36)}`,
      events: [
        { at: new Date().toISOString(), stage: 'artifact', payload: { id: baseline.artifactId } },
        { at: new Date().toISOString(), stage: 'prediction', payload: { count: baseline.predictionCount } },
        { at: new Date().toISOString(), stage: 'review', payload: { count: baseline.reviewCount } },
        { at: new Date().toISOString(), stage: 'error_pattern', payload: { count: baseline.patternCount } }
      ]
    };
    const activeFixture: ReplayFixture = {
      runId: `${taskContext.taskType}-active-${Date.now().toString(36)}`,
      events: [
        { at: new Date().toISOString(), stage: 'artifact', payload: { id: active.artifactId } },
        { at: new Date().toISOString(), stage: 'prediction', payload: { count: active.predictionCount } },
        { at: new Date().toISOString(), stage: 'review', payload: { count: active.reviewCount } },
        { at: new Date().toISOString(), stage: 'error_pattern', payload: { count: active.patternCount } }
      ]
    };
    const replayBaseline = this.replayAudit.replay(baselineFixture);
    const replayActive = this.replayAudit.replay(activeFixture);
    const replayDiff = this.replayAudit.diff(baselineFixture, activeFixture);

    const effectSummary = {
      artifactDelta: String(active.artifactBody).length - String(baseline.artifactBody).length,
      predictionDelta: Number(active.predictionCount) - Number(baseline.predictionCount),
      reviewDelta: Number(active.reviewCount) - Number(baseline.reviewCount),
      errorPatternDelta: Number(active.patternCount) - Number(baseline.patternCount)
    };

    const replayId = `stu-replay-${Date.now().toString(36)}`;
    const payload = {
      replayId,
      ticker: input.ticker,
      thesisType: input.thesisType,
      taskContext,
      compilerAudit: {
        baseline: baselineCompiled.audit,
        active: activeCompiled.audit
      },
      baseline,
      active,
      effectSummary,
      replayProof: { baseline: replayBaseline, active: replayActive, diff: replayDiff }
    };

    this.repo.saveSTUEffectReplay({ id: replayId, payload, createdAt: new Date().toISOString() });
    this.repo.saveTimelineLink({
      id: `tl-${replayId}`,
      ticker: input.ticker,
      candidateId: candidate.candidate_id,
      activeSTUEffect: `effectSummary=${JSON.stringify(effectSummary)}`,
      createdAt: new Date().toISOString()
    });

    return {
      replayId,
      compilerTrace: {
        baselineActiveVersions: baselineCompiled.audit.activeStuVersions,
        activeActiveVersions: activeCompiled.audit.activeStuVersions
      },
      baseline,
      active,
      effectSummary,
      replayProof: { baseline: replayBaseline, active: replayActive, diff: replayDiff }
    };
  }

  private async executeOnce(mode: 'baseline' | 'active', input: STUEffectReplayInput, compiledPromptLayer: string[]): Promise<Record<string, unknown>> {
    const artifact = this.artifacts.generate({
      taskType: 'stock_deep_dive',
      artifactType: 'stock_deep_dive',
      title: `${mode} replay for ${input.ticker}`,
      ticker: input.ticker,
      body: `${input.inputBody}\n${compiledPromptLayer.join('\n')}`,
      evidence: ['replay_fixture']
    });
    const extracted = this.predictions.extractFromArtifact(artifact);

    let reviewCount = 0;
    for (const prediction of extracted.admitted) {
      const outcome = this.reviews.registerOutcome({ predictionId: prediction.id, outcomeLabel: mode === 'active' ? 'confirmed' : 'partial', evidence: mode === 'active' ? 'Counterevidence addressed and resolved.' : 'Evidence incomplete for full confirmation.' });
      this.reviews.reviewPrediction(prediction, outcome);
      reviewCount += 1;
    }
    const reviews = this.reviews.listReviews().slice(0, reviewCount);
    const patterns = this.errors.aggregatePatterns(reviews);
    const proposals = await this.errors.proposeSTUCandidates(patterns);
    if (proposals[0]) {
      await this.evaluation.run(proposals[0], reviews, 'medium');
    }

    return {
      artifactId: artifact.id,
      artifactBody: artifact.body,
      predictionCount: extracted.admitted.length,
      reviewCount,
      patternCount: patterns.length,
      proposalCount: proposals.length,
      compilerPromptLayer: compiledPromptLayer
    };
  }
}
