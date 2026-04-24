import { SUPPORTED_CLAIM_TYPES } from './types.mjs';

function normalize(text) {
  return String(text ?? '').toLowerCase();
}

export function classifyClaimType(statement) {
  const s = normalize(statement);

  if (/(risk|downside|uncertain|volatility|exposure)/.test(s)) {
    return 'risk_claim';
  }

  if (/(recommend|should|consider|suggest|next step)/.test(s)) {
    return 'recommendation_claim';
  }

  if (/(prioritize|priority|rank|first|second|urgent)/.test(s)) {
    return 'prioritization_claim';
  }

  return 'judgment_claim';
}

export function estimateReviewability(statement) {
  const s = normalize(statement);

  if (s.length < 20) {
    return 'not_reviewable';
  }

  if (/(maybe|perhaps|nice|interesting|good point)/.test(s)) {
    return 'weakly_reviewable';
  }

  return 'reviewable';
}

export function normalizeClaimType(claimType) {
  return SUPPORTED_CLAIM_TYPES.includes(claimType) ? claimType : 'judgment_claim';
}
