export class HermesIngestError extends Error {
  /** @param {string} code @param {string} message @param {Record<string, unknown>} [details] */
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'HermesIngestError';
    this.code = code;
    this.details = details;
  }
}

export function validationError(code, message, details = {}) {
  return new HermesIngestError(code, message, details);
}

export function ensure(condition, error) {
  if (!condition) {
    throw error;
  }
}
