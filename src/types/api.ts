export type DecimalInput = string | number;

export interface TransferRequestBody {
  fromAccountId: string;
  toAccountId: string;
  amount: DecimalInput;
  idempotencyKey: string;
  quoteId?: string;
}

export interface FxQuoteRequestBody {
  fromCurrency: string;
  toCurrency: string;
}

export interface PayrollTransfer {
  fromAccountId: string;
  toAccountId: string;
  amount: DecimalInput;
  idempotencyKey: string;
  quoteId?: string;
}

export interface PayrollRequestBody {
  transfers: PayrollTransfer[];
}

export interface TransferSuccessResponse {
  success: true;
  transactionId: string;
}

export interface PayrollSuccessResponse {
  success: true;
  jobId: string;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
}
