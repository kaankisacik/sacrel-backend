/* eslint-disable @typescript-eslint/no-explicit-any */
const Iyzipay: any = require("iyzipay");

export type IyzicoBINCheckBody = {
  price: string;
  binNumber: string;
};

export type IyzicoInitPWIBody = {
  locale: string;
  conversationId: string;
  price: number | string;
  basketId: string;
  paymentGroup: string;
  callbackUrl: string;
  currency: string;
  paidPrice: number;
  buyer: Record<string, any>;
  shippingAddress: Record<string, any>;
  billingAddress: Record<string, any>;
  basketItems: Array<Record<string, any>>;
};

export type IyzicoRetrivePWIBody = {
  locale: string;
  conversationId: string;
  token: string;
};

export type IyzicoInit3DSBody = {
  locale: string;
  conversationId: string;
  price: number | string;
  paidPrice: number | string;
  currency: string;
  installment: number;
  paymentChannel: string;
  basketId: string;
  paymentGroup: string;
  callbackUrl: string;
  paymentCard: {
    cardHolderName: string;
    cardNumber: string;
    expireYear: string;
    expireMonth: string;
    cvc: string;
    registerCard?: number;
  };
  buyer: Record<string, any>;
  shippingAddress: Record<string, any>;
  billingAddress: Record<string, any>;
  basketItems: Array<Record<string, any>>;
};

export type IyzicoAuth3DSBody = {
  locale: string;
  paymentId: string;
  conversationId: string;
  conversationData?: string;
};

function toMoney(v: number | string) {
  const n = typeof v === "number" ? v : Number(v);
  if (!isFinite(n) || n < 0) return "0.00";
  return n.toFixed(2);
}

export class IyzicoDirect {
  private client: any;

  constructor(opts?: {
    apiKey?: string;
    secretKey?: string;
    baseUrl?: string;
  }) {
    const apiKey = opts?.apiKey ?? process.env.IYZI_API_KEY;
    const secretKey = opts?.secretKey ?? process.env.IYZI_SECRET_KEY;
    const uri = opts?.baseUrl ?? process.env.IYZI_BASE_URL;

    if (!apiKey || !secretKey || !uri) {
      throw new Error("[iyzico] Missing IYZI_* envs");
    }
    this.client = new Iyzipay({ apiKey, secretKey, uri });
  }

  async binCheck(body: IyzicoBINCheckBody) {
    const request = {
      locale: "tr",
      price: toMoney(body.price),
      binNumber: String(body.binNumber),
    };

    return await new Promise<any>((resolve, reject) => {
      this.client.binNumber.retrieve(request, (err: any, res: any) =>
        err ? reject(err) : resolve(res)
      );
    });
  }

  async init3DS(body: IyzicoInit3DSBody) {
    const request = {
      ...body,
      price: toMoney(body.price),
      paidPrice: toMoney(body.paidPrice),
      installment: 1, //String(body.installment ?? 1)
      currency: String(body.currency || "TRY").toUpperCase(),
      paymentCard: {
        ...body.paymentCard,
        registerCard: String(body.paymentCard.registerCard ?? 0),
      },
      basketItems: (body.basketItems || []).map((i) => ({
        ...i,
        price: toMoney((i as any).price ?? 0),
      })),
    };

    return await new Promise<any>((resolve, reject) => {
      this.client.threedsInitialize.create(request, (err: any, res: any) =>
        err ? reject(err) : resolve(res)
      );
    });
  }

  async auth3DS(body: IyzicoAuth3DSBody) {
    const request = {
      locale: body.locale || "tr",
      paymentId: String(body.paymentId),
      conversationId: String(body.conversationId),
      ...(body.conversationData
        ? { conversationData: body.conversationData }
        : {}),
    };

    return await new Promise<any>((resolve, reject) => {
      this.client.threedsPayment.create(request, (err: any, res: any) =>
        err ? reject(err) : resolve(res)
      );
    });
  }

  //pwi = payment with iyzico
  async initPWI(body: IyzicoInitPWIBody) {
    const request = {
      ...body,
      price: toMoney(body.price),
      paidPrice: toMoney(body.paidPrice),
      currency: String(body.currency || "TRY").toUpperCase(),
      basketItems: (body.basketItems || []).map((i) => ({
        ...i,
        price: toMoney((i as any).price ?? 0),
      })),
    };
    return await new Promise<any>((resolve, reject) => {
      this.client.paymentWithIyzico.initialize.create(
        request,
        (err: any, res: any) => (err ? reject(err) : resolve(res))
      );
    });
  }

  // iyzico ile öde (PWI) Sorgulama
  async retrivePWI(body: IyzicoRetrivePWIBody) {
    const request = {
      locale: body.locale || "tr",
      conversationId: String(body.conversationId),
      token: String(body.token),
    };
    return await new Promise<any>((resolve, reject) => {
      this.client.paymentWithIyzico.retrieve.get(
        request,
        (err: any, res: any) => (err ? reject(err) : resolve(res))
      );
    });
  }
}
