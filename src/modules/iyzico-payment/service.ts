import { AbstractPaymentProvider, MedusaError } from "@medusajs/framework/utils"
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
  PaymentSessionStatus,
  Logger,
  WebhookActionResult,
} from "@medusajs/framework/types"

type Options = {
  apiKey?: string
  secretKey?: string
  baseUrl?: string
}

type IyzicoPaymentData = {
  paymentId?: string
  conversationId?: string
  authorized?: boolean
  captured?: boolean
  amount?: number
  currency?: string
}

export default class IyzicoPaymentService extends AbstractPaymentProvider<Options> {
  static identifier = "iyzico"

  protected logger_: Logger
  protected options_: Options

  constructor({ logger }: { logger: Logger }, options: Options) {
    super({ logger }, options)
    
    this.logger_ = logger
    this.options_ = options

    // Validate required configuration
    if (!options.apiKey || !options.secretKey || !options.baseUrl) {
      this.logger_.warn(
        "İyzico payment provider is not properly configured. Missing apiKey, secretKey, or baseUrl."
      )
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    try {
      // İyzico için minimal session data
      const sessionData: IyzicoPaymentData = {
        conversationId: (input.context as any)?.cart_id || `cart_${Date.now()}`,
        amount: typeof input.amount === 'number' ? input.amount : parseFloat(input.amount.toString()),
        currency: input.currency_code,
        authorized: false,
        captured: false,
      }

      return {
        id: `iyzico_session_${Date.now()}`,
        data: sessionData,
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to initiate İyzico payment: ${error.message}`
      )
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    try {
      const existingData = (input.data || {}) as IyzicoPaymentData

      // İyzico 3DS sürecinde authorization dışarıdan yapılır
      // Bu method sadece session'ı authorized olarak işaretler
      const updatedData: IyzicoPaymentData = {
        ...existingData,
        authorized: true,
        paymentId: (input.context as any)?.paymentId || existingData.paymentId,
      }

      return {
        data: updatedData,
        status: "authorized" as PaymentSessionStatus,
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to authorize İyzico payment: ${error.message}`
      )
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    try {
      const existingData = (input.data || {}) as IyzicoPaymentData

      if (!existingData.authorized) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot capture payment: not authorized"
        )
      }

      const updatedData: IyzicoPaymentData = {
        ...existingData,
        captured: true,
      }

      return {
        data: updatedData,
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to capture İyzico payment: ${error.message}`
      )
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    try {
      const existingData = (input.data || {}) as IyzicoPaymentData

      if (!existingData.captured) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot refund payment: not captured"
        )
      }

      // İyzico refund logic buraya eklenebilir
      return {
        data: existingData,
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to refund İyzico payment: ${error.message}`
      )
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    try {
      const existingData = (input.data || {}) as IyzicoPaymentData

      if (existingData.captured) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Cannot cancel captured payment"
        )
      }

      const updatedData: IyzicoPaymentData = {
        ...existingData,
        authorized: false,
      }

      return {
        data: updatedData,
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to cancel İyzico payment: ${error.message}`
      )
    }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    try {
      const data = (input.data || {}) as IyzicoPaymentData

      let status: PaymentSessionStatus = "pending"
      
      if (data.captured) {
        status = "captured"
      } else if (data.authorized) {
        status = "authorized"
      }

      return {
        data,
        status,
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to get İyzico payment status: ${error.message}`
      )
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    // İyzico için delete işlemi genellikle gerekli değil
    return {
      data: input.data || {},
    }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return {
      data: input.data || {},
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return {
      data: { ...input.data, ...input.context },
    }
  }

  async getWebhookActionAndData(data: {
    data: Record<string, unknown>
    rawData: string | Buffer
    headers: Record<string, unknown>
  }): Promise<WebhookActionResult> {
    try {
      // İyzico webhook logic buraya eklenebilir
      return {
        action: "authorized",
        data: {
          session_id: data.data.session_id as string || "unknown",
          amount: (data.data.amount as number) || 0,
        },
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to process İyzico webhook: ${error.message}`
      )
    }
  }
}