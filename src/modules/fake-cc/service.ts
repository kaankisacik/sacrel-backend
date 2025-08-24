// Medusa v2 Fake Credit Card Payment Provider (dev-only)
// Directory structure (inside your Medusa app):
//   src/modules/fake-cc/service.ts
//   src/modules/fake-cc/index.ts
// Then register it in medusa-config.ts under the Payment module (snippet below).
//
// This provider fakes a credit-card style flow:
// - initiatePayment: creates a fake session and returns a "client_secret"
// - authorizePayment: marks it as authorized
// - capturePayment / refundPayment / cancelPayment: update the stored data
// - getPaymentStatus: maps our flags to Medusa PaymentSessionStatus
//
// ⚠️ For local/dev only: do not store real PAN/CVC; this is a stub for UI flows.

// src/modules/fake-cc/service.ts
import {
  AbstractPaymentProvider,
  MedusaError,
} from "@medusajs/framework/utils";
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
  Logger,
  PaymentSessionStatus,
} from "@medusajs/framework/types";

// ---- Types ---------------------------------------------------------------
type Options = {
  testMode?: boolean;
};

type FakeFlags = {
  external_id: string;
  authorized?: boolean;
  captured?: boolean;
  refunded_amount?: number;
  last4?: string;
  currency_code?: string;
};

function randId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export default class FakeCcProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "fake-cc";

  protected logger_: Logger;
  protected options_: Options;

  constructor({ logger }: { logger: Logger }, options: Options) {
    super({ logger }, options);
    this.logger_ = logger;
    this.options_ = options ?? { testMode: true };
  }

  // 1) Called when creating the payment session (cart checkout)
  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    // You can pass back anything your storefront needs (e.g., client token)
    const external_id = randId("ps");
    const data: FakeFlags = {
      external_id,
      authorized: false,
      captured: false,
      refunded_amount: 0,
      currency_code: "usd", // Default currency for fake provider
    };

    // Optionally surface a client_secret for the frontend to "confirm" with
    return {
      id: external_id,
      data: {
        ...data,
        client_secret: randId("secret"),
        method: "card", // <-- ek
        is_credit_card: true, // <-- ek (UI'nin beklediği ad buysa)
      },
      // No special status here; session continues to authorization
    };
  }

  // 2) Authorize the payment session
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const last4 = (input.data as any)?.last4 ?? "4242";
    const data: FakeFlags = {
      ...(input.data as any),
      last4,
      authorized: true,
      method: "card",
      is_credit_card: true,
    };

    // In a real provider, you would call your PSP here and map their result
    return {
      data,
      status: "authorized" as PaymentSessionStatus,
    };
  }

  // 3) Capture an authorized payment
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    if (!(input.data as any)?.authorized) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Nothing to capture: payment is not authorized"
      );
    }

    const data: FakeFlags = {
      ...(input.data as any),
      captured: true,
    };

    return { data };
  }

  // 4) Refund all or part of a captured payment
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const amount = Number(input.amount ?? 0);
    if (!(input.data as any)?.captured) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cannot refund an uncaptured payment"
      );
    }

    const prev = Number((input.data as any)?.refunded_amount ?? 0);
    const data: FakeFlags = {
      ...(input.data as any),
      refunded_amount: prev + amount,
    };

    return { data };
  }

  // 5) Cancel (void) an authorized payment
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    if ((input.data as any)?.captured) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot cancel: already captured"
      );
    }

    const data: FakeFlags = {
      ...(input.data as any),
      authorized: false,
    };

    return { data };
  }

  // 6) Map provider-specific flags to a generic Medusa status
  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const d = (input.data || {}) as FakeFlags;

    let status: PaymentSessionStatus = "pending";
    if (d.captured) status = "captured";
    else if (d.authorized) status = "authorized";

    return { data: d as any, status };
  }

  // Required methods from AbstractPaymentProvider
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    // For fake provider, we just return the data as-is
    return { data: input.data || {} };
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    // For fake provider, return the stored session data
    return { data: input.data || {} };
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // For fake provider, just return the updated data
    return { data: input.data || {} };
  }

  async getWebhookActionAndData(data: {
    data: Record<string, unknown>;
    rawData: string | Buffer;
    headers: Record<string, unknown>;
  }): Promise<WebhookActionResult> {
    // For fake provider, we don't handle real webhooks
    // Return a default action that indicates no processing needed
    return {
      action: "authorized",
      data: {
        session_id: "fake-session",
        amount: 0,
      },
    };
  }
}
// ---- End of service -------------------------------------------------------
