import { SUPPORTED_TASK_TYPES } from './types.mjs';

function looksLikeSmallTalk(statement) {
  const s = String(statement ?? '').trim().toLowerCase();
  return /^(hi|hello|thanks|thank you|ok|nice|great|sounds good)[.!?]?$/.test(s);
}

export function evaluateAdmission({ statement, taskType, reviewability }) {
  const failures = [];

  if (!statement || !String(statement).trim()) {
    failures.push('empty_statement');
  }

  if (looksLikeSmallTalk(statement)) {
    failures.push('smalltalk_statement');
  }

  if (!SUPPORTED_TASK_TYPES.includes(taskType)) {
    failures.push('unsupported_task_type');
  }

  if (!['reviewable', 'weakly_reviewable', 'not_reviewable'].includes(reviewability)) {
    failures.push('invalid_reviewability');
  }

  return {
    admitted: failures.length === 0 && reviewability !== 'not_reviewable',
    failures
  };
}
