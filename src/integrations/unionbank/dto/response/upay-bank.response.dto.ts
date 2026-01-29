/**
 * UPay Bank List Response DTOs
 * Based on UnionBank UPay API documentation (compiled YAML definitions):
 * - UPayInstapayBankResponse
 * - UPayPesonetBankResponse
 */

export interface UPayBankRecord {
  code: string;
  bank: string;
  brstn: string;
}

/**
 * Response for GET /upay/payments/v1/instapay/banks
 */
export interface UPayInstapayBankResponse {
  records?: UPayBankRecord[];
}

/**
 * Response for GET /upay/payments/v1/pesonet/banks
 *
 * Note: The compiled YAML has an inconsistency (`record` vs `records` in examples). putangina naman kasi.
 * We accept both to be resilient.
 */
export interface UPayPesonetBankResponse {
  record?: UPayBankRecord[];
  records?: UPayBankRecord[];
}
