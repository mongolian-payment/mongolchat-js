# @mongolian-payment/mongolchat

MongolChat payment SDK for Node.js -- QR payments and webhook handling.

## Installation

```bash
npm install @mongolian-payment/mongolchat
```

Requires Node.js >= 18.0.0 (uses native `fetch`).

## Quick Start

```typescript
import { MongolChatClient } from "@mongolian-payment/mongolchat";

const client = new MongolChatClient({
  endpoint: "https://api.mongolchat.mn",
  apiKey: "your-api-key",
  workerKey: "your-worker-key",
  appSecret: "your-app-secret",
  branchNo: "001",
});

// Generate a QR code
const qr = await client.generateQr({
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
});

console.log(qr.qr); // The QR code string

// Check QR payment status
const status = await client.checkQr(qr.qr);
console.log(status.status); // "PAID", "PENDING", etc.
```

## Configuration

### Direct

```typescript
const client = new MongolChatClient({
  endpoint: "https://api.mongolchat.mn",
  apiKey: "your-api-key",
  workerKey: "your-worker-key",
  appSecret: "your-app-secret",
  branchNo: "001",
});
```

### From Environment Variables

```typescript
import { loadConfigFromEnv, MongolChatClient } from "@mongolian-payment/mongolchat";

const config = loadConfigFromEnv();
const client = new MongolChatClient(config);
```

| Environment Variable     | Config Field |
| ------------------------ | ------------ |
| `MONGOLCHAT_ENDPOINT`    | endpoint     |
| `MONGOLCHAT_API_KEY`     | apiKey       |
| `MONGOLCHAT_WORKER_KEY`  | workerKey    |
| `MONGOLCHAT_APP_SECRET`  | appSecret    |
| `MONGOLCHAT_BRANCH_NO`   | branchNo     |

## API

### `client.generateQr(input)`

Generate an online QR code for payment.

**Parameters:**

| Field           | Type            | Required | Description                |
| --------------- | --------------- | -------- | -------------------------- |
| amount          | number          | Yes      | Payment amount in MNT      |
| products        | MchatProduct[]  | Yes      | List of products           |
| title           | string          | Yes      | Payment title              |
| subTitle        | string          | Yes      | Payment subtitle           |
| noat            | string          | Yes      | NOAT (VAT) number          |
| nhat            | string          | Yes      | NHAT number                |
| ttd             | string          | Yes      | TTD number                 |
| referenceNumber | string          | Yes      | Unique reference number    |
| expireTime      | string          | Yes      | QR expiration time         |
| branchId        | string          | No       | Branch ID override         |

**Returns:** `MchatOnlineQrGenerateResponse` with `qr`, `code`, and `message`.

### `client.checkQr(qr)`

Check the payment status of a QR code.

**Parameters:**

| Field | Type   | Required | Description                      |
| ----- | ------ | -------- | -------------------------------- |
| qr    | string | Yes      | QR code string from generateQr   |

**Returns:** `MchatOnlineQrCheckResponse` with `status`, `code`, `message`, `id`, `who_paid`, and `user_ref_id`.

## Webhook Types

The SDK exports TypeScript types for handling MongolChat webhooks:

```typescript
import type {
  MchatWebhookInput,
  MchatWebhookScanQR,
  MchatWebhookQuickpay,
  MchatWebhookOrder,
} from "@mongolian-payment/mongolchat";
```

## Error Handling

All API errors throw a `MongolChatError`:

```typescript
import { MongolChatError } from "@mongolian-payment/mongolchat";

try {
  await client.generateQr(input);
} catch (err) {
  if (err instanceof MongolChatError) {
    console.error(err.message); // "MongolChat error (2001): Invalid amount"
    console.error(err.code);    // 2001
    console.error(err.response); // Raw response object
  }
}
```

The MongolChat API uses code `1000` for success. Any other code is treated as an error.

## License

MIT
