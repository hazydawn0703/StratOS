export class HermesClaimPresetError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'HermesClaimPresetError';
    this.code = code;
    this.details = details;
  }
}

export function claimPresetError(code, message, details = {}) {
  return new HermesClaimPresetError(code, message, details);
}
