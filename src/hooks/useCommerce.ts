"use client";

import { Logger } from "loglevel";
import { Order, Product } from "./types/commerce";
import { useLogger } from "@/utils/logger";
export type { Order, Product } from "./types/commerce";


class CommerceApi {
  baseUrl: string = "/api/commerce";

  constructor(private readonly logger: Logger){}

  async createOrder(): Promise<Order> {
    const response = await fetch(this.baseUrl + "/orders", { method: "POST", body: "{}" });
    return response.json();
  }

  async getOrder(orderId: string): Promise<Order> {
    const response = await fetch(this.baseUrl + "/orders/" + orderId + "?context=edit");
    return response.json();
  }

  async getProducts(): Promise<Product[]> {
    const response = await fetch(this.baseUrl + "/products");
    return response.json();
  }

  async updateOrder(order: Partial<Order>): Promise<Order | null> {
    const response = await fetch(this.baseUrl + "/orders/" + order.id, { body: JSON.stringify(order), method: "PUT" });
    if (response.ok) {
      return response.json();
    } else {
      this.logger.error(response.statusText);
      return null;
    }
  }
}

export function useCommerce() {
  const logger = useLogger("CommerceApi");
  return new CommerceApi(logger);
}

