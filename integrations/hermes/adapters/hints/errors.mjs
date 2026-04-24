export class HermesHintsError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'HermesHintsError';
    this.code = code;
    this.details = details;
  }
}

export function hintsError(code, message, details = {}) {
  return new HermesHintsError(code, message, details);
}
