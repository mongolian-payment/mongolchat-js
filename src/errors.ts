/**
 * Custom error class for MongolChat API errors.
 *
 * Includes the API response code and raw response body when available.
 */
export class MongolChatError extends Error {
  public readonly code?: number;
  public readonly response?: unknown;

  constructor(message: string, code?: number, response?: unknown) {
    super(message);
    this.name = "MongolChatError";
    this.code = code;
    this.response = response;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
