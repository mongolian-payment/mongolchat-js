import type { MongolChatConfig } from "./types.js";

/**
 * Validates the client configuration, throwing if any required field is missing.
 */
export function validateConfig(config: MongolChatConfig): void {
  if (!config.endpoint) {
    throw new Error("MongolChatConfig: endpoint is required");
  }
  if (!config.apiKey) {
    throw new Error("MongolChatConfig: apiKey is required");
  }
  if (!config.workerKey) {
    throw new Error("MongolChatConfig: workerKey is required");
  }
  if (!config.appSecret) {
    throw new Error("MongolChatConfig: appSecret is required");
  }
  if (!config.branchNo) {
    throw new Error("MongolChatConfig: branchNo is required");
  }
}

/**
 * Load MongolChat configuration from environment variables.
 *
 * | Variable                 | Config field |
 * |--------------------------|--------------|
 * | MONGOLCHAT_ENDPOINT      | endpoint     |
 * | MONGOLCHAT_API_KEY       | apiKey       |
 * | MONGOLCHAT_WORKER_KEY    | workerKey    |
 * | MONGOLCHAT_APP_SECRET    | appSecret    |
 * | MONGOLCHAT_BRANCH_NO     | branchNo     |
 *
 * @returns A fully populated MongolChatConfig
 * @throws If any required environment variable is missing
 */
export function loadConfigFromEnv(): MongolChatConfig {
  const endpoint = process.env.MONGOLCHAT_ENDPOINT;
  const apiKey = process.env.MONGOLCHAT_API_KEY;
  const workerKey = process.env.MONGOLCHAT_WORKER_KEY;
  const appSecret = process.env.MONGOLCHAT_APP_SECRET;
  const branchNo = process.env.MONGOLCHAT_BRANCH_NO;

  if (!endpoint) {
    throw new Error(
      "MONGOLCHAT_ENDPOINT environment variable is required",
    );
  }
  if (!apiKey) {
    throw new Error(
      "MONGOLCHAT_API_KEY environment variable is required",
    );
  }
  if (!workerKey) {
    throw new Error(
      "MONGOLCHAT_WORKER_KEY environment variable is required",
    );
  }
  if (!appSecret) {
    throw new Error(
      "MONGOLCHAT_APP_SECRET environment variable is required",
    );
  }
  if (!branchNo) {
    throw new Error(
      "MONGOLCHAT_BRANCH_NO environment variable is required",
    );
  }

  return { endpoint, apiKey, workerKey, appSecret, branchNo };
}
