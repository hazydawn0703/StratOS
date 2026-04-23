export class HermesArtifactAdaptationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'HermesArtifactAdaptationError';
    this.code = code;
    this.details = details;
  }
}

export function adaptationError(code, message, details = {}) {
  return new HermesArtifactAdaptationError(code, message, details);
}
