# Wallet Service – NestJS Backend Take‑Home Test

## Overview

This project implements a **simple wallet service** using **NestJS** and **TypeScript**. It satisfies the requirements of the Backend Developer take‑home test by providing clean APIs for wallet creation, funding, transfers, and retrieval of wallet details with transaction history.

The solution prioritizes **clarity, correctness, and good engineering judgment** over overengineering.

---

## Features

### Core (Required)

*  Create Wallet (USD)
*  Fund Wallet (positive amounts only)
*  Transfer Funds Between Wallets
*  Prevent Negative Balances
*  Fetch Wallet Details
*  Transaction History per Wallet
*  Input Validation & Meaningful Errors

### Optional / Bonus

* ⭐ Idempotent fund & transfer operations
* ⭐ Unit tests for services & controllers
* ⭐ Notes on production scalability

---

## Tech Stack

* **NestJS**
* **TypeScript**
* **TypeORM**
* **SQLite** (local / in‑memory friendly)
* **Jest** (unit testing)

---

## Project Structure

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── constants/
│   │   └── enum.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── utils/
├── modules/
│   ├── wallet/
│   │   ├── controller/
│   │   ├── services/
│   │   ├── entities/
│   │   └── dto/
│   └── transaction/
│       ├── controller/
│       ├── services/
│       ├── entities/
│       └── dto/
└── test/
```

---

## Environment Setup

Create a `.env` file using the example below:

```env
APP_NAME=nova-wallet-service
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database (SQLite)
DB_TYPE=sqlite
DB_NAME=walletdb
```

---

## Installation

```bash
# Install dependencies
npm install
```

---

## Running the Application

```bash
# Development mode
npm run start
```

The API will be available at:

```
http://localhost:3000/api/v1
```

---

## API Endpoints

### 1. Create Wallet

**POST** `/wallets`

```json
{}
```

Response:

```json
{
  "id": "uuid",
  "currency": "USD",
  "balance": 0
}
```

---

### 2. Fund Wallet

**POST** `/wallets/:id/fund`

```json
{
  "amount": 100
}
```

> Amounts are converted to **cents** in teh dto ($100.00 = 10000)

---

### 3. Transfer Funds

**POST** `/wallets/transfer`

```json
{
  "senderWalletId": "uuid",
  "receiverWalletId": "uuid",
  "amount": 5000
}
```

Validations:

* Sender & receiver must exist
* Sender must have sufficient balance
* Amount must be positive

---

### 4. Fetch Wallet Details

**GET** `/wallets/:id`

Response:

```json
{
  "wallet": {
    "id": "uuid",
    "currency": "USD",
    "balance": 5000
  },
  "transactions": [
    {
      "id": "uuid",
      "type": "FUND",
      "amount": 10000,
      "createdAt": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

## Error Handling

The API returns meaningful HTTP errors:

| Scenario             | HTTP Status     |
| -------------------- | --------------- |
| Invalid input        | 400 Bad Request |
| Wallet not found     | 404 Not Found   |
| Insufficient balance | 409 Conflict    |

---

## Testing

Run unit tests:

```bash
npm run test
```

Test coverage includes:

* Wallet service logic
* Transaction service logic
* Controller dependency wiring
* Exception handling

---

## Design Decisions & Assumptions

* **Currency:** USD only (extensible via enum)
* **Amounts:** Stored and processed in **cents** to avoid floating‑point issues
* **Transactions:** Every fund or transfer creates a transaction record
* **Idempotency:** Optional idempotency key supported for safe retries
* **Storage:** SQLite chosen for simplicity (in‑memory compatible)

---

## Scaling Notes (Production)

If this system were to scale:

* Move to **PostgreSQL** with proper indexing
* Add **database transactions & row‑level locks**
* Introduce **message queues** for async transaction processing
* Add **rate limiting & authentication**
* Use **Redis** for idempotency keys
* Add **observability** (logs, metrics, tracing)

---

## Submission Notes

* This repository fulfills all required functional requirements
* Optional features implemented where reasonable
* Focus kept on readability, correctness, and simplicity

---

## Author

Backend Developer Take‑Home Test – NestJS

---

Thank you for reviewing 🙌
