import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MongolChatClient } from "../src/client.js";
import { MongolChatError } from "../src/errors.js";
import { loadConfigFromEnv } from "../src/config.js";

// ── Helpers ──

const CONFIG = {
  endpoint: "https://api.mongolchat.test",
  apiKey: "test-api-key",
  workerKey: "test-worker-key",
  appSecret: "test-app-secret",
  branchNo: "001",
};

const GENERATE_INPUT = {
  amount: 5000,
  products: [
    { product_name: "Coffee", quantity: "1", price: 5000, tag: "food" },
  ],
  title: "Coffee Shop",
  subTitle: "Order #123",
  noat: "123456",
  nhat: "654321",
  ttd: "789",
  referenceNumber: "REF-001",
  expireTime: "2026-12-31T23:59:59",
};

// ── Tests ──

describe("MongolChatClient", () => {
  let client: MongolChatClient;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new MongolChatClient(CONFIG);
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Constructor ──

  describe("constructor", () => {
    it("should throw if endpoint is missing", () => {
      expect(
        () => new MongolChatClient({ ...CONFIG, endpoint: "" }),
      ).toThrow("endpoint is required");
    });

    it("should throw if apiKey is missing", () => {
      expect(
        () => new MongolChatClient({ ...CONFIG, apiKey: "" }),
      ).toThrow("apiKey is required");
    });

    it("should throw if workerKey is missing", () => {
      expect(
        () => new MongolChatClient({ ...CONFIG, workerKey: "" }),
      ).toThrow("workerKey is required");
    });

    it("should throw if appSecret is missing", () => {
      expect(
        () => new MongolChatClient({ ...CONFIG, appSecret: "" }),
      ).toThrow("appSecret is required");
    });

    it("should throw if branchNo is missing", () => {
      expect(
        () => new MongolChatClient({ ...CONFIG, branchNo: "" }),
      ).toThrow("branchNo is required");
    });

    it("should strip trailing slashes from endpoint", () => {
      const c = new MongolChatClient({
        ...CONFIG,
        endpoint: "https://api.mongolchat.test///",
      });
      expect(c).toBeInstanceOf(MongolChatClient);
    });
  });

  // ── generateQr ──

  describe("generateQr", () => {
    it("should send correct request and return response", async () => {
      const apiResponse = {
        qr: "QRCODE123",
        code: 1000,
        message: "Success",
      };
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => apiResponse,
      });

      const result = await client.generateQr(GENERATE_INPUT);

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe(
        "https://api.mongolchat.test/worker/onlineqr/generate",
      );
      expect(opts.method).toBe("POST");
      expect(opts.headers["api-key"]).toBe("test-api-key");
      expect(opts.headers["Authorization"]).toBe(
        "WorkerKey test-worker-key",
      );
      expect(opts.headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(opts.body);
      expect(body.amount).toBe(5000);
      expect(body.title).toBe("Coffee Shop");
      expect(body.sub_title).toBe("Order #123");
      expect(body.noat).toBe("123456");
      expect(body.nhat).toBe("654321");
      expect(body.ttd).toBe("789");
      expect(body.reference_number).toBe("REF-001");
      expect(body.expire_time).toBe("2026-12-31T23:59:59");
      expect(body.products).toEqual([
        { product_name: "Coffee", quantity: "1", price: 5000, tag: "food" },
      ]);
      expect(body.branch_id).toBeUndefined();

      expect(result).toEqual(apiResponse);
    });

    it("should include branch_id when branchId is provided", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ qr: "QR", code: 1000, message: "OK" }),
      });

      await client.generateQr({ ...GENERATE_INPUT, branchId: "BR-002" });

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.branch_id).toBe("BR-002");
    });

    it("should throw MongolChatError when code is not 1000", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          qr: "",
          code: 2001,
          message: "Invalid amount",
        }),
      });

      await expect(client.generateQr(GENERATE_INPUT)).rejects.toThrow(
        MongolChatError,
      );

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          qr: "",
          code: 2001,
          message: "Invalid amount",
        }),
      });

      await expect(client.generateQr(GENERATE_INPUT)).rejects.toThrow(
        "MongolChat error (2001): Invalid amount",
      );
    });

    it("should throw MongolChatError on network failure", async () => {
      fetchSpy.mockRejectedValueOnce(new Error("Connection refused"));

      await expect(client.generateQr(GENERATE_INPUT)).rejects.toThrow(
        "Network error calling /worker/onlineqr/generate: Connection refused",
      );
    });

    it("should throw MongolChatError on invalid JSON", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
        text: async () => "not json",
      });

      await expect(client.generateQr(GENERATE_INPUT)).rejects.toThrow(
        "Invalid JSON response",
      );
    });
  });

  // ── checkQr ──

  describe("checkQr", () => {
    it("should send POST with qr in body and return response", async () => {
      const apiResponse = {
        status: "PAID",
        code: 1000,
        message: "Success",
        id: "TXN-456",
        who_paid: "user@example.com",
        user_ref_id: "UREF-789",
      };
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => apiResponse,
      });

      const result = await client.checkQr("QRCODE123");

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [url, opts] = fetchSpy.mock.calls[0];
      expect(url).toBe(
        "https://api.mongolchat.test/worker/onlineqr/status",
      );
      expect(opts.method).toBe("POST");
      expect(opts.headers["api-key"]).toBe("test-api-key");
      expect(opts.headers["Authorization"]).toBe(
        "WorkerKey test-worker-key",
      );

      const body = JSON.parse(opts.body);
      expect(body).toEqual({ qr: "QRCODE123" });

      expect(result).toEqual(apiResponse);
    });

    it("should throw MongolChatError when code is not 1000", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: "",
          code: 3001,
          message: "QR not found",
          id: "",
          who_paid: "",
          user_ref_id: "",
        }),
      });

      await expect(client.checkQr("INVALID")).rejects.toThrow(
        "MongolChat error (3001): QR not found",
      );
    });

    it("should throw MongolChatError on network failure", async () => {
      fetchSpy.mockRejectedValueOnce(new Error("Timeout"));

      await expect(client.checkQr("QR")).rejects.toThrow(
        "Network error calling /worker/onlineqr/status: Timeout",
      );
    });

    it("should throw MongolChatError on invalid JSON", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
        text: async () => "bad",
      });

      await expect(client.checkQr("QR")).rejects.toThrow(
        "Invalid JSON response",
      );
    });
  });

  // ── MongolChatError ──

  describe("MongolChatError", () => {
    it("should be an instance of Error", () => {
      const err = new MongolChatError("test", 2001);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(MongolChatError);
      expect(err.name).toBe("MongolChatError");
      expect(err.message).toBe("test");
      expect(err.code).toBe(2001);
    });

    it("should include response data", () => {
      const data = { qr: "", code: 2001, message: "fail" };
      const err = new MongolChatError("fail", 2001, data);
      expect(err.response).toEqual(data);
    });
  });
});

// ── loadConfigFromEnv ──

describe("loadConfigFromEnv", () => {
  beforeEach(() => {
    vi.stubEnv("MONGOLCHAT_ENDPOINT", "");
    vi.stubEnv("MONGOLCHAT_API_KEY", "");
    vi.stubEnv("MONGOLCHAT_WORKER_KEY", "");
    vi.stubEnv("MONGOLCHAT_APP_SECRET", "");
    vi.stubEnv("MONGOLCHAT_BRANCH_NO", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should load config from environment variables", () => {
    vi.stubEnv("MONGOLCHAT_ENDPOINT", "https://api.mongolchat.mn");
    vi.stubEnv("MONGOLCHAT_API_KEY", "key1");
    vi.stubEnv("MONGOLCHAT_WORKER_KEY", "wk1");
    vi.stubEnv("MONGOLCHAT_APP_SECRET", "sec1");
    vi.stubEnv("MONGOLCHAT_BRANCH_NO", "001");

    const config = loadConfigFromEnv();
    expect(config).toEqual({
      endpoint: "https://api.mongolchat.mn",
      apiKey: "key1",
      workerKey: "wk1",
      appSecret: "sec1",
      branchNo: "001",
    });
  });

  it("should throw if MONGOLCHAT_ENDPOINT is missing", () => {
    vi.stubEnv("MONGOLCHAT_API_KEY", "k");
    vi.stubEnv("MONGOLCHAT_WORKER_KEY", "w");
    vi.stubEnv("MONGOLCHAT_APP_SECRET", "s");
    vi.stubEnv("MONGOLCHAT_BRANCH_NO", "b");

    expect(() => loadConfigFromEnv()).toThrow("MONGOLCHAT_ENDPOINT");
  });

  it("should throw if MONGOLCHAT_API_KEY is missing", () => {
    vi.stubEnv("MONGOLCHAT_ENDPOINT", "https://api.test");
    vi.stubEnv("MONGOLCHAT_WORKER_KEY", "w");
    vi.stubEnv("MONGOLCHAT_APP_SECRET", "s");
    vi.stubEnv("MONGOLCHAT_BRANCH_NO", "b");

    expect(() => loadConfigFromEnv()).toThrow("MONGOLCHAT_API_KEY");
  });

  it("should throw if MONGOLCHAT_WORKER_KEY is missing", () => {
    vi.stubEnv("MONGOLCHAT_ENDPOINT", "https://api.test");
    vi.stubEnv("MONGOLCHAT_API_KEY", "k");
    vi.stubEnv("MONGOLCHAT_APP_SECRET", "s");
    vi.stubEnv("MONGOLCHAT_BRANCH_NO", "b");

    expect(() => loadConfigFromEnv()).toThrow("MONGOLCHAT_WORKER_KEY");
  });

  it("should throw if MONGOLCHAT_APP_SECRET is missing", () => {
    vi.stubEnv("MONGOLCHAT_ENDPOINT", "https://api.test");
    vi.stubEnv("MONGOLCHAT_API_KEY", "k");
    vi.stubEnv("MONGOLCHAT_WORKER_KEY", "w");
    vi.stubEnv("MONGOLCHAT_BRANCH_NO", "b");

    expect(() => loadConfigFromEnv()).toThrow("MONGOLCHAT_APP_SECRET");
  });

  it("should throw if MONGOLCHAT_BRANCH_NO is missing", () => {
    vi.stubEnv("MONGOLCHAT_ENDPOINT", "https://api.test");
    vi.stubEnv("MONGOLCHAT_API_KEY", "k");
    vi.stubEnv("MONGOLCHAT_WORKER_KEY", "w");
    vi.stubEnv("MONGOLCHAT_APP_SECRET", "s");

    expect(() => loadConfigFromEnv()).toThrow("MONGOLCHAT_BRANCH_NO");
  });
});
