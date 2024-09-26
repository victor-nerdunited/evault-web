"use client";

import { Logger } from "loglevel";
import { Order, Product } from "./types/commerce";
import { useLogger } from "@/utils/useLogger";
import { getPrice, getPrices } from "@/utils/priceUtil";
import { getTokenPrice } from "@/utils/tokenPrice";
import { PaymentToken } from "@/types/payment-token";
export type { Order, Product } from "./types/commerce";


class CommerceApi {
  baseUrl: string = "/api/commerce";

  constructor(private readonly logger: Logger){}

  async createOrder(): Promise<Order> {
    const response = await fetch(this.baseUrl + "/orders", { method: "POST", body: "{}" });
    return response.json();
  }

  async getOrder(orderId: string, paymentToken: PaymentToken): Promise<Order> {
    const response = await fetch(this.baseUrl + "/orders/" + orderId + "?context=edit");
    const order: Order = await response.json();
    return await this.updateCartPricesAsync(order, paymentToken);
  }

  async getProducts(paymentToken: PaymentToken): Promise<Product[]> {
    const response = await fetch(this.baseUrl + "/products");
    if (!response.ok) return [];

    const products: Product[] = await response.json();
    const mineralPrices = await getPrices();
    const tokenPrice = await getTokenPrice(paymentToken);
    await Promise.all(products.map(async (p) => {
      const price = await getPrice(mineralPrices, p.name, p.sku, tokenPrice);
      p.price = price.toFixedDecimal();
    }));
    return products;
  }

  async updateOrder(order: Partial<Order>, paymentToken: PaymentToken): Promise<Order | null> {
    const response = await fetch(this.baseUrl + "/orders/" + order.id, { body: JSON.stringify(order), method: "PUT" });
    if (response.ok) {
      const order = await response.json();
      return await this.updateCartPricesAsync(order, paymentToken);
    } else {
      this.logger.error(response.statusText);
      return null;
    }
  }

  async updateCartPricesAsync(cart: Order, paymentToken: PaymentToken): Promise<Order> {
    const prices = await getPrices();
    const tokenPrice = await getTokenPrice(paymentToken);
    const _subtotal = cart.line_items?.reduce((acc, item) => {
      const price = getPrice(prices!, item.name!, item.sku ?? "", tokenPrice);
      item.price = price;
      return acc + price * item.quantity;
    }, 0) ?? 0;
    cart.total = _subtotal.toFixedDecimal();
    return cart;
  }
}

export function useCommerce() {
  const logger = useLogger("CommerceApi");
  return new CommerceApi(logger);
}