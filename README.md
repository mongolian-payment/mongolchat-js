# @mongolian-payment/mongolchat

MongolChat payment SDK for Node.js — generate online QR payments and check their status.

[![npm version](https://img.shields.io/npm/v/@mongolian-payment/mongolchat.svg)](https://www.npmjs.com/package/@mongolian-payment/mongolchat)
[![license](https://img.shields.io/npm/l/@mongolian-payment/mongolchat.svg)](./LICENSE)

> Part of the **[mongolian-payment](https://github.com/mongolian-payment)** SDK suite.
> Also available for Python: **[mongolian-payment-mongolchat](https://pypi.org/project/mongolian-payment-mongolchat/)** ([source](https://github.com/mongolian-payment/mongolchat-py)).

## Requirements

- Node.js >= 18.0.0 (uses native `fetch`)

## Installation

```bash
npm install @mongolian-payment/mongolchat
```

## Quick Start

```typescript
import { MongolChatClient } from "@mongolian-payment/mongolchat";

const client = new MongolChatClient({
  endpoint: "https://api.mongolchat.mn",
  apiKey: "YOUR_API_KEY",
  workerKey: "YOUR_WORKER_KEY",
  appSecret: "YOUR_APP_SECRET",
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

// Check payment status
const status = await client.checkQr(qr.qr);
console.log(status.status); // e.g. "PAID", "PENDING"
```

## Configuration from Environment Variables

```typescript
import { MongolChatClient, loadConfigFromEnv } from "@mongolian-payment/mongolchat";

const client = new MongolChatClient(loadConfigFromEnv());
```

| Variable                | Description                                  |
| ----------------------- | -------------------------------------------- |
| `MONGOLCHAT_ENDPOINT`   | MongolChat API base URL                      |
| `MONGOLCHAT_API_KEY`    | API key for the `api-key` header             |
| `MONGOLCHAT_WORKER_KEY` | Worker key for the `Authorization` header    |
| `MONGOLCHAT_APP_SECRET` | Application secret                           |
| `MONGOLCHAT_BRANCH_NO`  | Branch number                                |

> Never hard-code credentials — load them from the environment or a secrets vault.

## API Reference

| Method | Description |
|--------|-------------|
| `generateQr(input)` | Generate an online QR code → `{ qr, code, message }` |
| `checkQr(qr)` | Check payment status for a QR code → `{ status, code, message, id, who_paid, user_ref_id }` |

```typescript
const qr = await client.generateQr({
  amount: 5000,
  products: [{ product_name: "Coffee", quantity: "1", price: 5000, tag: "food" }],
  title: "Coffee Shop",
  subTitle: "Order #123",
  noat: "123456",
  nhat: "654321",
  ttd: "789",
  referenceNumber: "REF-001",
  expireTime: "2026-12-31T23:59:59",
  branchId: "002", // optional branch override
});

const status = await client.checkQr(qr.qr);
console.log(status.status, status.who_paid, status.user_ref_id);
```

The SDK also exports TypeScript types for handling MongolChat webhooks:

```typescript
import type {
  MchatWebhookInput,
  MchatWebhookScanQR,
  MchatWebhookQuickpay,
  MchatWebhookOrder,
} from "@mongolian-payment/mongolchat";
```

## Error Handling

All API errors throw `MongolChatError`, which includes the API response code and raw
response body. The MongolChat API uses code `1000` for success — any other code is
treated as an error:

```typescript
import { MongolChatError } from "@mongolian-payment/mongolchat";

try {
  await client.generateQr(input);
} catch (err) {
  if (err instanceof MongolChatError) {
    console.error(err.message);  // "MongolChat error (2001): Invalid amount"
    console.error(err.code);     // API response code (e.g. 2001)
    console.error(err.response); // Raw response body
  }
}
```

## License

MIT
