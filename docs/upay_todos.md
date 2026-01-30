# UPay follow-ups (TODO / checklist)

This file tracks **remaining UPay gaps** to address in a future pass. Items are marked:

- [ ] pending
- [X] done (already implemented in this repo)

## Missing request/response fields

### Request DTOs missing fields

- [X] **`billerUuid` required in API requests** (per YAML docs around line ~35734)
  - **Where**: `src/modules/upay/dto/upay.dto.ts` (likely `CreateUpayTransactionDto`)
  - **Also impacts**: `src/integrations/unionbank/dto/request/*` payload mapping
- [X] **`countryCode` optional for international numbers** (per PDF lines 149–154)
  - **Where**: `CreateUpayTransactionDto` + request mapping + redirect payload (see below)
- [X] **`backRedir` optional redirect URL (“Back to Merchant” link)** (per PDF line 159)
  - **Where**: `CreateUpayTransactionDto` + request mapping + redirect payload (see below)

### Redirect payload missing fields

- [X] **`countryCode` not included in `UpayRedirectPayload`**
- [X] **`backRedir` not included in `UpayRedirectPayload`**

> Note: This applies to the *WhiteLabel redirect integration* payload/encryption flow (PDF).

## Missing functionality

### Biller Autopost webhook handler

- [ ] **Webhook endpoint/handler to receive autopost notifications from UnionBank**
  - **Why**: Documentation mentions autopost (PDF lines 946–952)
  - **Expected**: handle successful transaction notifications for automatic posting
  - **Deliverables**:
    - A webhook route (module/controller)
    - Verification/auth strategy (as agreed with UnionBank)
    - DTO/schema + persistence/audit logging
    - Idempotency handling (dedupe repeated notifications)

### UPay module/controller

- [X] **Dedicated UPay controller exposing endpoints**
  - Implemented in: `src/modules/upay/upay.controller.ts`
  - Module/service: `src/modules/upay/upay.module.ts`, `src/modules/upay/upay.service.ts`

## Endpoint constants

### Missing from `unionbank-endpoints.constant.ts`

- [X] **`UPAY_BILLER_DETAILS`**
- [X] **`UPAY_BILLER_REFERENCES`**
- [X] **`UPAY_BILLER_UUID_STATUS`** (status inquiry that includes biller post status)
  - Implemented as `UPAY_BILLER_UUID_STATUS` in `unionbank-endpoints.constant.ts` (path: `/ubp/external/upay/payments/v1/transactions/{billerUuid}/status`); see `UpayBillerUuidStatusResponse` below.
- [X] **`UPAY_INSTAPAY_BANKS`**
- [X] **`UPAY_PESONET_BANKS`**
- [X] **Privacy policy endpoint constant**
  - Implemented as: `UPAY_PRIVACY_POLICY` (maps to `/ubp/external/upay/payments/v1/privacy`)
  - If you prefer naming parity with docs, consider aliasing to `UPAY_PRIVACY`

## Missing response DTOs

> Some DTOs already exist in `src/integrations/unionbank/dto/response/` and the module DTOs under `src/modules/upay/dto/`.

- [X] **Biller details response DTO**
  - Integration: `UpayBillerUuidResponse` in `src/integrations/unionbank/dto/response/upay-biller.response.dto.ts`
  - REST DTO: `UpayBillerResponseDto` in `src/modules/upay/dto/upay.dto.ts`
- [X] **Biller reference definitions response DTO**
  - Integration: `UpayBillerUuidReferencesResponse` in `src/integrations/unionbank/dto/response/upay-biller.response.dto.ts`
  - REST DTO: `UpayBillerReferencesResponseDto` in `src/modules/upay/dto/upay.dto.ts`
- [X] **`UpayBillerUuidStatusResponse` (status with biller post status)**
  - Integration DTO: `UpayBillerUuidStatusDataItem`, `UpayBillerUuidStatusResponse` in `src/integrations/unionbank/dto/response/upay-biller.response.dto.ts`
  - REST DTO: `UpayBillerUuidStatusDataItemDto`, `UpayBillerUuidStatusResponseDto` in `src/modules/upay/dto/upay.dto.ts`
  - Controller route: `GET /upay/payments/v1/transactions/:billerUuid/status` in `src/modules/upay/upay.controller.ts`
  - Service: `getBillerUuidStatus` in `upay.service.ts` and `unionbank-upay.service.ts`; endpoint constant `UPAY_BILLER_UUID_STATUS` in `unionbank-endpoints.constant.ts`
  - Documented in `docs/upay.md` (Get Biller UUID Status)
- [X] **InstaPay bank list response DTO**
  - Integration: `UPayInstapayBankResponse` in `src/integrations/unionbank/dto/response/upay-bank.response.dto.ts`
  - REST DTO: `UpayInstapayBankResponseDto` in `src/modules/upay/dto/upay.dto.ts`
- [X] **PESONet bank list response DTO**
  - Integration: `UPayPesonetBankResponse` in `src/integrations/unionbank/dto/response/upay-bank.response.dto.ts`
  - REST DTO: `UpayPesonetBankResponseDto` in `src/modules/upay/dto/upay.dto.ts`

## Missing validation/features

- [ ] **Reference validation**
  - **Goal**: dynamic validation based on biller reference definitions (per YAML)
  - **Approach**: fetch biller references, then validate request `references[]` against min/max/required/pattern
- [ ] **Payment method validation**
  - **Goal**: validate payment method against enabled/availed channels per biller (requires biller details lookup)
- [ ] **Country code handling**
  - **Goal**: default to PH (63) if invalid/missing (per PDF)
- [ ] **DITO number support**
  - **Goal**: explicit support for +63 8 numbers (per PDF line 156)
  - **Note**: current `mobileNumber` validation allows 10–13 digits; confirm whether additional normalization is needed.
