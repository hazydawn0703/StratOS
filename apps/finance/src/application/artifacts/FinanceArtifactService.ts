import { FinanceRepository } from '../../domain/repository.js';
import type { ArtifactType, FinanceArtifact, FinanceTaskType } from '../../domain/models.js';

export interface GenerateArtifactInput {
  taskType: FinanceTaskType;
  artifactType: ArtifactType;
  title: string;
  body: string;
  ticker?: string;
  evidence?: string[];
}

export class FinanceArtifactService {
  constructor(private readonly repo = new FinanceRepository()) {}

  generate(input: GenerateArtifactInput): FinanceArtifact {
    const artifact: FinanceArtifact = {
      id: `artifact-${Date.now().toString(36)}`,
      taskType: input.taskType,
      artifactType: input.artifactType,
      title: input.title,
      ticker: input.ticker,
      body: input.body,
      generatedAt: new Date().toISOString(),
      evidence: input.evidence ?? []
    };

    return this.repo.saveArtifact(artifact);
  }

  list(): FinanceArtifact[] {
    return this.repo.listArtifacts();
  }
}
