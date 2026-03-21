import type { STU } from '@stratos/shared-types';

export const detectConflicts = (stus: STU[]): string[] => {
  const seen = new Set<string>();
  const conflicts: string[] = [];
  for (const stu of stus) {
    for (const prompt of stu.promptLayer) {
      if (seen.has(prompt)) conflicts.push(`duplicate_prompt:${prompt}`);
      seen.add(prompt);
    }
  }
  return conflicts;
};
