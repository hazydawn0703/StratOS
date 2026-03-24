import type { STU } from '@stratos/shared-types';

export const strategyFilter = (stus: STU[], taskType: string): STU[] =>
  stus.filter((stu) => stu.scope.includes(taskType));
