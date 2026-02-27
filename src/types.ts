// ── Configuration ──

/** Configuration for MongolChatClient */
export interface MongolChatConfig {
  /** MongolChat API base endpoint */
  endpoint: string;
  /** API key for the `api-key` header */
  apiKey: string;
  /** Worker key for the `Authorization: WorkerKey` header */
  workerKey: string;
  /** Application secret */
  appSecret: string;
  /** Branch number */
  branchNo: string;
}

// ── Product ──

/** A product item in a QR payment request */
export interface MchatProduct {
  /** Product name */
  product_name: string;
  /** Quantity (string in the API) */
  quantity: string;
  /** Price in MNT */
  price: number;
  /** Product tag / category */
  tag: string;
}

// ── QR Generate ──

/** Input for generating a QR code (camelCase SDK interface) */
export interface MchatGenerateQrInput {
  /** Payment amount in MNT */
  amount: number;
  /** List of products */
  products: MchatProduct[];
  /** Payment title */
  title: string;
  /** Payment subtitle */
  subTitle: string;
  /** NOAT (VAT) number */
  noat: string;
  /** NHAT number */
  nhat: string;
  /** TTD number */
  ttd: string;
  /** Unique reference number */
  referenceNumber: string;
  /** QR expiration time */
  expireTime: string;
  /** Optional branch ID override */
  branchId?: string;
}

/** Wire-format request body for POST /worker/onlineqr/generate */
export interface MchatOnlineQrGenerateRequest {
  amount: number;
  branch_id?: string;
  products: MchatProduct[];
  title: string;
  sub_title: string;
  noat: string;
  nhat: string;
  ttd: string;
  reference_number: string;
  expire_time: string;
}

/** Response from QR code generation */
export interface MchatOnlineQrGenerateResponse {
  /** The generated QR code string */
  qr: string;
  /** Response code (1000 = success) */
  code: number;
  /** Response message */
  message: string;
}

// ── QR Check ──

/** Response from checking QR payment status */
export interface MchatOnlineQrCheckResponse {
  /** Payment status */
  status: string;
  /** Response code (1000 = success) */
  code: number;
  /** Response message */
  message: string;
  /** Transaction ID (populated when paid) */
  id: string;
  /** Who paid (populated when paid) */
  who_paid: string;
  /** User reference ID (populated when paid) */
  user_ref_id: string;
}

// ── Webhook Types ──

/** Webhook payload for scan QR events */
export interface MchatWebhookScanQR {
  reference_number: string;
  who_paid: string;
  user_ref_id: string;
  transaction_id: string;
  generated_qrcode: string;
  amount: number;
  date: string;
  products: MchatProduct[];
}

/** Webhook payload for quickpay events */
export interface MchatWebhookQuickpay {
  reference_number: string;
  who_paid: string;
  user_ref_id: string;
  transaction_id: string;
  amount: number;
  date: string;
  products: MchatProduct[];
}

/** Webhook payload for order events */
export interface MchatWebhookOrder {
  reference_number: string;
  who_paid: string;
  user_ref_id: string;
  transaction_id: string;
  order_id: string;
  amount: number;
  date: string;
  products: MchatProduct[];
}

/** Raw webhook input envelope */
export interface MchatWebhookInput {
  /** Webhook event type */
  type: string;
  /** Webhook event data */
  data: unknown;
}
