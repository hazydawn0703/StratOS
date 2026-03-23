export interface Prediction {
  id: string;
  scope: string;
  thesisType: string;
  statement: string;
  bullishCase: string;
  cautiousCase: string;
  measurableTarget: string;
  evaluationMethod: string;
  confidenceScore: number;
  triggerType: string;
  triggerAt: string;
  uncertaintyNote: string;
}
