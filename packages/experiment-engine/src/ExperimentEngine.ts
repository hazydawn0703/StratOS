import type {
  ApprovalSLAAlertMessage,
  EvaluationInput,
  EvaluationResult,
  ExperimentCandidate,
  ExperimentMode,
  ExperimentResult,
  ManualApprovalTicket,
  PromotionAuditRecord,
  PromotionPolicy,
  RuntimeGovernanceEvent
} from '@stratos/shared-types';
import type { TaskContext } from '@stratos/shared-types';
import {
  DatabaseGovernanceEventStore,
  InMemoryQueueAdapter,
  type GovernanceEventStore,
  type QueueAdapter
} from '@stratos/infrastructure';
import { decidePromotionAction } from './decision/promotionDecision.js';
import { StrategyLifecycleGuard } from './lifecycle/StrategyLifecycleGuard.js';
import { deterministicRollout } from './rollout/deterministicRollout.js';
import type { ExperimentRecord } from './types.js';

export class ExperimentEngine {
  private readonly experiments = new Map<string, ExperimentRecord>();
  private readonly lifecycleGuard = new StrategyLifecycleGuard();
  private readonly eventStore: GovernanceEventStore;
  private readonly alertQueue: QueueAdapter<ApprovalSLAAlertMessage>;
  private readonly approvalTickets = new Map<string, ManualApprovalTicket>();
  private readonly slaAlertedTickets = new Set<string>();

  constructor(
    eventStore: GovernanceEventStore = new DatabaseGovernanceEventStore(),
    alertQueue: QueueAdapter<ApprovalSLAAlertMessage> = new InMemoryQueueAdapter<ApprovalSLAAlertMessage>()
  ) {
    this.eventStore = eventStore;
    this.alertQueue = alertQueue;
  }

  async registerCandidate(candidateId: string): Promise<void> {
    await this.lifecycleGuard.registerCandidate(candidateId);
  }

  async markCandidateEvaluated(candidateId: string, note?: string): Promise<void> {
    await this.lifecycleGuard.markEvaluated(candidateId, note);
  }

  createExperimentCandidate(
    evaluationInput: EvaluationInput,
    evaluation: { recommendation: 'promote' | 'hold'; delta: number }
  ): ExperimentCandidate {
    return {
      candidate_id: evaluationInput.candidate_id,
      gate_status: evaluationInput.gate_status,
      evaluation_recommendation: evaluation.recommendation,
      evaluation_delta: evaluation.delta
    };
  }

  async startExperimentGuarded(candidateId: string): Promise<ExperimentRecord> {
    await this.lifecycleGuard.markExperimenting(candidateId);

    const record: ExperimentRecord = {
      id: `exp-${candidateId}`,
      candidateId,
      candidateVersion: 'candidate-v1',
      baselineVersion: 'baseline-v1',
      mode: 'shadow',
      bucket: 'default',
      state: 'shadow',
      metrics: []
    };
    this.experiments.set(record.id, record);
    return record;
  }

  decideExposure(experimentId: string, taskContext: TaskContext): number {
    return deterministicRollout(`${experimentId}:${taskContext.taskType}`);
  }

  recordMetrics(experimentId: string, metrics: Record<string, number>): void {
    const exp = this.experiments.get(experimentId);
    if (!exp) return;
    exp.metrics.push(metrics);
    exp.state = exp.metrics.length > 2 ? 'canary' : 'shadow';
  }

  async decidePromotion(experimentId: string): Promise<'promoted' | 'rolled_back'> {
    const exp = this.experiments.get(experimentId);
    if (!exp) return 'rolled_back';

    const latest = exp.metrics.at(-1);
    const decision: 'promoted' | 'rolled_back' = (latest?.actionableScore ?? 0) >= 0.6 ? 'promoted' : 'rolled_back';
    exp.state = decision;

    if (decision === 'promoted') {
      await this.lifecycleGuard.activate(exp.candidateId, `promotion approved by ${experimentId}`);
    } else {
      await this.lifecycleGuard.rollback(exp.candidateId, `promotion rejected by ${experimentId}`);
    }

    return decision;
  }

  runExperiment(input: {
    experimentId: string;
    candidateId: string;
    candidateVersion: string;
    baselineVersion: string;
    mode: ExperimentMode;
    bucket: string;
    sampleSize: number;
    observationWindowHours: number;
    metrics: Record<string, number>;
    rollbackReady: boolean;
    notes?: string[];
  }): ExperimentResult {
    const record: ExperimentRecord = {
      id: input.experimentId,
      candidateId: input.candidateId,
      candidateVersion: input.candidateVersion,
      baselineVersion: input.baselineVersion,
      mode: input.mode,
      bucket: input.bucket,
      state: input.mode,
      metrics: [input.metrics]
    };
    this.experiments.set(input.experimentId, record);
    return {
      experiment_id: input.experimentId,
      candidate_id: input.candidateId,
      candidate_version: input.candidateVersion,
      baseline_version: input.baselineVersion,
      mode: input.mode,
      bucket: input.bucket,
      sample_size: input.sampleSize,
      observation_window_hours: input.observationWindowHours,
      metrics: input.metrics,
      rollback_ready: input.rollbackReady,
      notes: input.notes ?? []
    };
  }

  async evaluatePromotion(input: {
    runId?: string;
    policy: PromotionPolicy;
    evaluation: EvaluationResult;
    experiment: ExperimentResult;
    sourceErrorPatternId: string;
    impactedTaskType: string;
  }): Promise<{ decision: PromotionAuditRecord['decision']; audit: PromotionAuditRecord }> {
    const runId = input.runId ?? `run-${input.evaluation.candidate_id}`;
    const action = decidePromotionAction({
      policy: input.policy,
      evaluation: input.evaluation,
      experiment: input.experiment
    });
    const decision: PromotionAuditRecord['decision'] = {
      candidate_id: input.evaluation.candidate_id,
      candidate_version: input.evaluation.candidate_version,
      baseline_version: input.evaluation.baseline_version,
      action,
      reasons: [
        `evaluation:${input.evaluation.recommendation}`,
        `experiment_mode:${input.experiment.mode}`,
        `sample_size:${input.experiment.sample_size}`
      ],
      requires_manual_approval: action === 'manual_review' ? true : input.policy.require_manual_approval,
      approval_status: action === 'manual_review' ? 'pending' : 'not_required'
    };

    if (action === 'promote') {
      await this.lifecycleGuard.activate(input.evaluation.candidate_id, 'promotion approved');
    } else if (action === 'rollback' || action === 'deprecate') {
      await this.lifecycleGuard.rollback(input.evaluation.candidate_id, 'rollback/deprecate decision');
    }

    if (decision.action === 'manual_review') {
      const ticket: ManualApprovalTicket = {
        ticket_id: `approval-${input.evaluation.candidate_id}`,
        run_id: runId,
        candidate_id: input.evaluation.candidate_id,
        candidate_version: input.evaluation.candidate_version,
        requested_action: 'promote',
        status: 'pending',
        requested_at: new Date().toISOString(),
        sla_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      this.approvalTickets.set(ticket.ticket_id, ticket);
      await this.appendEvent({
        event_id: `${ticket.ticket_id}-requested`,
        run_id: runId,
        candidate_id: input.evaluation.candidate_id,
        type: 'manual_approval_requested',
        at: ticket.requested_at,
        payload: { ticket_id: ticket.ticket_id, requested_action: ticket.requested_action }
      });
    }

    await this.appendEvent({
      event_id: `decision-${input.evaluation.candidate_id}-${Date.now()}`,
      run_id: runId,
      candidate_id: input.evaluation.candidate_id,
      type: 'promotion_decision_evaluated',
      at: new Date().toISOString(),
      payload: { action: decision.action, requires_manual_approval: decision.requires_manual_approval }
    });

    return {
      decision,
      audit: {
        audit_id: `audit-${runId}-${input.evaluation.candidate_id}`,
        run_id: runId,
        candidate_id: input.evaluation.candidate_id,
        source_error_pattern_id: input.sourceErrorPatternId,
        evaluation: input.evaluation,
        experiment: input.experiment,
        decision,
        active_stu_version: action === 'promote' ? input.evaluation.candidate_version : undefined,
        impacted_task_type: input.impactedTaskType,
        created_at: new Date().toISOString()
      }
    };
  }

  getManualApprovalTicket(candidateId: string): ManualApprovalTicket | undefined {
    return this.approvalTickets.get(`approval-${candidateId}`);
  }

  async approvePromotion(input: {
    runId?: string;
    candidateId: string;
    approver: string;
    note?: string;
    approve: boolean;
    audit: PromotionAuditRecord;
  }): Promise<PromotionAuditRecord> {
    const runId = input.runId ?? `run-${input.candidateId}`;
    const ticketId = `approval-${input.candidateId}`;
    const ticket = this.approvalTickets.get(ticketId);
    if (!ticket) {
      throw new Error(`manual approval ticket not found for candidate: ${input.candidateId}`);
    }
    if (input.audit.candidate_id !== input.candidateId) {
      throw new Error('candidateId does not match audit record');
    }
    if (input.audit.decision.action !== 'manual_review') {
      throw new Error('approvePromotion can only be used for manual_review decisions');
    }

    const reviewedAt = new Date().toISOString();
    ticket.status = input.approve ? 'approved' : 'rejected';
    ticket.reviewed_at = reviewedAt;
    ticket.reviewed_by = input.approver;
    ticket.note = input.note;

    if (input.approve) {
      await this.lifecycleGuard.activate(input.candidateId, `manual approval by ${input.approver}`);
    } else {
      await this.lifecycleGuard.rollback(input.candidateId, `manual rejection by ${input.approver}`);
    }

    await this.appendEvent({
      event_id: `${ticketId}-${input.approve ? 'approved' : 'rejected'}-${Date.now()}`,
      run_id: runId,
      candidate_id: input.candidateId,
      type: input.approve ? 'manual_approval_approved' : 'manual_approval_rejected',
      at: reviewedAt,
      payload: { approver: input.approver, note: input.note ?? '' }
    });

    return {
      ...input.audit,
      decision: {
        ...input.audit.decision,
        action: input.approve ? 'promote' : 'rollback',
        approval_status: input.approve ? 'approved' : 'rejected',
        approved_by: input.approver,
        approved_at: reviewedAt,
        reasons: [
          ...input.audit.decision.reasons,
          input.approve ? `manual_approved_by:${input.approver}` : `manual_rejected_by:${input.approver}`,
          ...(input.note ? [`manual_note:${input.note}`] : [])
        ]
      },
      active_stu_version: input.approve ? input.audit.evaluation.candidate_version : undefined
    };
  }

  async rejectPromotion(input: {
    runId?: string;
    candidateId: string;
    approver: string;
    note?: string;
    audit: PromotionAuditRecord;
  }): Promise<PromotionAuditRecord> {
    return this.approvePromotion({
      ...input,
      approve: false
    });
  }

  async listGovernanceEvents(candidateId: string): Promise<RuntimeGovernanceEvent[]> {
    return this.eventStore.listByCandidate(candidateId);
  }

  async listGovernanceEventsByRunId(runId: string): Promise<RuntimeGovernanceEvent[]> {
    return this.eventStore.listByRunId(runId);
  }

  async checkApprovalSLA(input: {
    candidateId: string;
    runId?: string;
    now?: string;
  }): Promise<{ breached: boolean; dueAt?: string }> {
    const ticket = this.getManualApprovalTicket(input.candidateId);
    if (!ticket || !ticket.sla_due_at || ticket.status !== 'pending') {
      return { breached: false };
    }

    const nowIso = input.now ?? new Date().toISOString();
    if (nowIso <= ticket.sla_due_at) {
      return { breached: false, dueAt: ticket.sla_due_at };
    }

    await this.appendEvent({
      event_id: `sla-${ticket.ticket_id}-${Date.now()}`,
      run_id: input.runId ?? ticket.run_id,
      candidate_id: input.candidateId,
      type: 'approval_sla_breached',
      at: nowIso,
      payload: { due_at: ticket.sla_due_at, status: ticket.status }
    });
    if (!this.slaAlertedTickets.has(ticket.ticket_id)) {
      await this.alertQueue.enqueue({
        alert_id: `alert-${ticket.ticket_id}`,
        run_id: input.runId ?? ticket.run_id,
        candidate_id: input.candidateId,
        ticket_id: ticket.ticket_id,
        due_at: ticket.sla_due_at,
        breached_at: nowIso,
        status: 'pending'
      });
      this.slaAlertedTickets.add(ticket.ticket_id);
    }
    return { breached: true, dueAt: ticket.sla_due_at };
  }

  async consumeNextSLAAlert(
    handler: (message: ApprovalSLAAlertMessage) => Promise<void> | void
  ): Promise<'empty' | 'processed' | 'retried'> {
    const item = await this.alertQueue.dequeue();
    if (!item) return 'empty';

    try {
      await handler(item.message);
      await this.alertQueue.ack(item.id);
      return 'processed';
    } catch {
      await this.alertQueue.retry(item.id);
      return 'retried';
    }
  }

  private async appendEvent(event: RuntimeGovernanceEvent): Promise<void> {
    await this.eventStore.append(event);
  }
}
