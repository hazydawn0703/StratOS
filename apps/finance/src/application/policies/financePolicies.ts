import type {
  FinanceErrorPattern,
  FinancePrediction,
  PredictionReview
} from '../../domain/models.js';

export class ClaimAdmissionPolicy {
  admit(prediction: Omit<FinancePrediction, 'id' | 'admittedAt'>): { ok: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (prediction.confidence < 0.55) reasons.push('confidence_below_threshold');
    if (prediction.horizonDays <= 0 || prediction.horizonDays > 365) reasons.push('invalid_horizon');
    if (!prediction.evidence || prediction.evidence.length < 1) reasons.push('missing_evidence');
    if (!prediction.thesis || prediction.thesis.trim().length < 20) reasons.push('thesis_too_vague');
    if (prediction.triggerType === 'time_based' && !prediction.triggerAt) reasons.push('missing_time_trigger');
    if (prediction.triggerType === 'event_based' && !prediction.triggerEvent) reasons.push('missing_event_trigger');
    return { ok: reasons.length === 0, reasons };
  }
}

export class EvaluationPolicy {
  accept(score: number): boolean {
    return score >= 0.6;
  }
}

export class PromotionPolicy {
  allow(params: { evaluationPassed: boolean; experimentLift: number }): boolean {
    return params.evaluationPassed && params.experimentLift >= 0.03;
  }
}

export class RoutingDecisionPolicy {
  routeForRisk(riskLevel: 'low' | 'medium' | 'high'): string {
    if (riskLevel === 'high') return 'finance-safe-review-route';
    if (riskLevel === 'medium') return 'finance-balanced-route';
    return 'finance-fast-route';
  }
}

export class BiasAlertPolicy {
  check(reviews: PredictionReview[]): { triggered: boolean; message?: string } {
    if (reviews.length === 0) return { triggered: false };
    const confidenceIssues = reviews.filter((r) => r.confidenceIssue).length;
    const ratio = confidenceIssues / reviews.length;
    if (ratio >= 0.4) {
      return { triggered: true, message: 'confidence_overstatement bias risk' };
    }

    return { triggered: false };
  }
}

export class ErrorPatternPromotionPolicy {
  canPromote(pattern: FinanceErrorPattern): boolean {
    return pattern.supportCount >= 3 && pattern.severity !== 'low';
  }
}
