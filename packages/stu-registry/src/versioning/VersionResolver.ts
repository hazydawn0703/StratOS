import type { STU } from '@stratos/shared-types';

export interface VersionResolver {
  resolveLatestActive(stuId: string): STU | undefined;
  resolveForExperiment(stuId: string, experimentId: string): STU | undefined;
}
