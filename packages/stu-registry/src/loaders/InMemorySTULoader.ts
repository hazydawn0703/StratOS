import type { STU } from '@stratos/shared-types';

export class InMemorySTULoader {
  constructor(private readonly stus: STU[] = []) {}

  load(): STU[] {
    return [...this.stus];
  }
}
