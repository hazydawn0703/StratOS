import type { TaskContext, STU } from '@stratos/shared-types';
import type { VersionResolver } from './versioning/VersionResolver.js';

export class STURegistry implements VersionResolver {
  private readonly records: STU[] = [];
  private readonly activeVersions = new Map<string, string>();

  register(stu: STU): void {
    this.records.push(stu);
    this.activeVersions.set(stu.stuId, stu.version);
  }

  list(): STU[] {
    return [...this.records];
  }

  getById(stuId: string): STU[] {
    return this.records.filter((stu) => stu.stuId === stuId);
  }

  getActive(taskContext: TaskContext): STU[] {
    return this.records.filter(
      (stu) => stu.scope.includes(taskContext.taskType) && this.activeVersions.get(stu.stuId) === stu.version
    );
  }

  activate(stuId: string, version: string): void {
    this.activeVersions.set(stuId, version);
  }

  deprecate(stuId: string, version: string): void {
    if (this.activeVersions.get(stuId) === version) {
      this.activeVersions.delete(stuId);
    }
  }

  resolveLatestActive(stuId: string): STU | undefined {
    const activeVersion = this.activeVersions.get(stuId);
    return this.records.find((stu) => stu.stuId === stuId && stu.version === activeVersion);
  }

  resolveForExperiment(stuId: string, _experimentId: string): STU | undefined {
    return this.resolveLatestActive(stuId);
  }
}
