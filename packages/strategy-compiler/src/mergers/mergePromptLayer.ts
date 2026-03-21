import type { STU } from '@stratos/shared-types';

export const mergePromptLayer = (stus: STU[]): string[] =>
  Array.from(new Set(stus.flatMap((stu) => stu.promptLayer)));
