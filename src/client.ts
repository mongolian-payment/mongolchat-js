import { MongolChatError } from "./errors.js";
import { validateConfig } from "./config.js";
import type {
  MongolChatConfig,
  MchatGenerateQrInput,
  MchatOnlineQrGenerateRequest,
  MchatOnlineQrGenerateResponse,
  MchatOnlineQrCheckResponse,
} from "./types.js";

/**
 * MongolChat payment client.
 *
 * Generates online QR codes and checks their payment status via the
 * MongolChat worker API.
 *
 * @example
 * ```ts
 * const client = new MongolChatClient({
 *   endpoint: "https://api.mongolchat.mn",
 *   apiKey: "my-api-key",
 *   workerKey: "my-worker-key",
 *   appSecret: "my-app-secret",
 *   branchNo: "001",
 * });
 *
 * const qr = await client.generateQr({
 *   amount: 5000,
 *   products: [{ product_name: "Coffee", quantity: "1", price: 5000, tag: "food" }],
 *   title: "Coffee Shop",
 *   subTitle: "Order #123",
 *   noat: "123456",
 *   nhat: "654321",
 *   ttd: "789",
 *   referenceNumber: "REF-001",
 *   expireTime: "2026-12-31T23:59:59",
 * });
 * console.log(qr.qr);
 *
 * const status = await client.checkQr(qr.qr);
 * console.log(status.status);
 * ```
 */
export class MongolChatClient {
  private readonly config: MongolChatConfig;

  constructor(config: MongolChatConfig) {
    validateConfig(config);
    this.config = {
      ...config,
      endpoint: config.endpoint.replace(/\/+$/, ""),
    };
  }

  /**
   * Build the common headers sent with every request.
   */
  private headers(): Record<string, string> {
    return {
      "api-key": this.config.apiKey,
      Authorization: `WorkerKey ${this.config.workerKey}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Generate a QR code for an online payment.
   *
   * @param input - QR generation parameters
   * @returns The generated QR code response
   * @throws {MongolChatError} If the API returns a non-1000 code or a network error occurs
   */
  async generateQr(
    input: MchatGenerateQrInput,
  ): Promise<MchatOnlineQrGenerateResponse> {
    const body: MchatOnlineQrGenerateRequest = {
      amount: input.amount,
      products: input.products,
      title: input.title,
      sub_title: input.subTitle,
      noat: input.noat,
      nhat: input.nhat,
      ttd: input.ttd,
      reference_number: input.referenceNumber,
      expire_time: input.expireTime,
    };

    if (input.branchId) {
      body.branch_id = input.branchId;
    }

    const url = `${this.config.endpoint}/worker/onlineqr/generate`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new MongolChatError(
        `Network error calling /worker/onlineqr/generate: ${message}`,
      );
    }

    let data: MchatOnlineQrGenerateResponse;
    try {
      data = (await res.json()) as MchatOnlineQrGenerateResponse;
    } catch {
      throw new MongolChatError(
        "Invalid JSON response from /worker/onlineqr/generate",
        undefined,
        await res.text().catch(() => ""),
      );
    }

    if (data.code !== 1000) {
      throw new MongolChatError(
        `MongolChat error (${data.code}): ${data.message}`,
        data.code,
        data,
      );
    }

    return data;
  }

  /**
   * Check the payment status of a QR code.
   *
   * @param qr - The QR code string returned from generateQr
   * @returns The QR status response
   * @throws {MongolChatError} If the API returns a non-1000 code or a network error occurs
   */
  async checkQr(qr: string): Promise<MchatOnlineQrCheckResponse> {
    const url = `${this.config.endpoint}/worker/onlineqr/status`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify({ qr }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new MongolChatError(
        `Network error calling /worker/onlineqr/status: ${message}`,
      );
    }

    let data: MchatOnlineQrCheckResponse;
    try {
      data = (await res.json()) as MchatOnlineQrCheckResponse;
    } catch {
      throw new MongolChatError(
        "Invalid JSON response from /worker/onlineqr/status",
        undefined,
        await res.text().catch(() => ""),
      );
    }

    if (data.code !== 1000) {
      throw new MongolChatError(
        `MongolChat error (${data.code}): ${data.message}`,
        data.code,
        data,
      );
    }

    return data;
  }
}
