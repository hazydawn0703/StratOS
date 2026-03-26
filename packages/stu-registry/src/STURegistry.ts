import type { STU, STUCandidate, TaskContext } from '@stratos/shared-types';
import type { VersionResolver } from './versioning/VersionResolver.js';

export type RegistryStatus = 'candidate' | 'experimenting' | 'active' | 'deprecated';

export interface STURegistryRecord {
  stu: STU;
  status: RegistryStatus;
  app: string;
  task_type: string;
  artifact_type: string;
}

export interface STURegistryQuery {
  status?: RegistryStatus;
  app?: string;
  task_type?: string;
  artifact_type?: string;
  version?: string;
}

export interface ExperimentAssignment {
  experiment_id: string;
  bucket: string;
  candidate_id: string;
  candidate_version: string;
}

export interface CompilationRegistryInput {
  active_stus: STU[];
  experiment_stus: STU[];
  candidate_stus: STU[];
}

export class STURegistry implements VersionResolver {
  private readonly records: STURegistryRecord[] = [];
  private readonly candidateSource = new Map<string, STUCandidate>();
  private readonly assignments = new Map<string, ExperimentAssignment>();

  register(stu: STU): void {
    this.records.push({
      stu,
      status: 'active',
      app: String(stu.meta.app ?? 'framework'),
      task_type: String(stu.meta.task_type ?? stu.scope[0] ?? 'unknown'),
      artifact_type: String(stu.meta.artifact_type ?? 'generic')
    });
  }

  registerCandidate(input: {
    candidate: STUCandidate;
    app: string;
    task_type: string;
    artifact_type: string;
    candidate_version: string;
    promptLayer?: string[];
    ruleLayer?: string[];
    routingProvider?: string;
  }): STU {
    const stu: STU = {
      stuId: input.candidate.candidate_id,
      version: input.candidate_version,
      meta: {
        app: input.app,
        task_type: input.task_type,
        artifact_type: input.artifact_type,
        source_error_pattern_id: input.candidate.source_error_pattern_id,
        status: 'candidate'
      },
      scope: [input.task_type],
      promptLayer: input.promptLayer ?? [input.candidate.strategy_summary],
      ruleLayer: input.ruleLayer ?? [],
      routingLayer: { provider: input.routingProvider ?? 'mock' },
      evaluation: { status: 'candidate' }
    };
    this.records.push({
      stu,
      status: 'candidate',
      app: input.app,
      task_type: input.task_type,
      artifact_type: input.artifact_type
    });
    this.candidateSource.set(input.candidate.candidate_id, input.candidate);
    return stu;
  }

  assignExperimentBucket(input: ExperimentAssignment): void {
    const key = `${input.experiment_id}:${input.bucket}`;
    const existing = this.assignments.get(key);
    if (existing && existing.candidate_version !== input.candidate_version) {
      throw new Error('experiment bucket is already bound to a different candidate version');
    }
    this.assignments.set(key, input);
    this.updateStatus(input.candidate_id, input.candidate_version, 'experimenting');
  }

  activate(stuId: string, version: string): void {
    this.updateStatus(stuId, version, 'active');
  }

  deprecate(stuId: string, version: string): void {
    this.updateStatus(stuId, version, 'deprecated');
  }

  list(query?: STURegistryQuery): STURegistryRecord[] {
    return this.records.filter((record) => {
      if (!query) return true;
      if (query.status && query.status !== record.status) return false;
      if (query.app && query.app !== record.app) return false;
      if (query.task_type && query.task_type !== record.task_type) return false;
      if (query.artifact_type && query.artifact_type !== record.artifact_type) return false;
      if (query.version && query.version !== record.stu.version) return false;
      return true;
    });
  }

  getActive(taskContext: TaskContext): STU[] {
    return this.list({ status: 'active', task_type: taskContext.taskType }).map((item) => item.stu);
  }

  getExperimenting(taskContext: TaskContext): STU[] {
    return this.list({ status: 'experimenting', task_type: taskContext.taskType }).map((item) => item.stu);
  }

  getCandidates(taskContext: TaskContext): STU[] {
    return this.list({ status: 'candidate', task_type: taskContext.taskType }).map((item) => item.stu);
  }

  getCompilationInput(taskContext: TaskContext, options?: { includeCandidates?: boolean }): CompilationRegistryInput {
    return {
      active_stus: this.getActive(taskContext),
      experiment_stus: this.getExperimenting(taskContext),
      candidate_stus: options?.includeCandidates ? this.getCandidates(taskContext) : []
    };
  }

  resolveLatestActive(stuId: string): STU | undefined {
    return this.records.find((record) => record.stu.stuId === stuId && record.status === 'active')?.stu;
  }

  resolveForExperiment(stuId: string, experimentId: string): STU | undefined {
    const assignment = [...this.assignments.values()].find(
      (item) => item.experiment_id === experimentId && item.candidate_id === stuId
    );
    if (!assignment) return undefined;
    return this.records.find(
      (record) => record.stu.stuId === stuId && record.stu.version === assignment.candidate_version
    )?.stu;
  }

  getSourceCandidate(candidateId: string): STUCandidate | undefined {
    return this.candidateSource.get(candidateId);
  }

  private updateStatus(stuId: string, version: string, status: RegistryStatus): void {
    const record = this.records.find((item) => item.stu.stuId === stuId && item.stu.version === version);
    if (!record) throw new Error(`unknown stu version: ${stuId}@${version}`);
    record.status = status;
    record.stu = { ...record.stu, evaluation: { ...(record.stu.evaluation ?? {}), status } };
  }
}
