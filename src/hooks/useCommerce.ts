"use client";

import { Order, Product } from "./types/commerce";
export type { Order, Product } from "./types/commerce";

class CommerceApi {
  baseUrl: string = "/api/commerce";

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

  async updateOrder(order: Partial<Order>): Promise<Order> {
    const response = await fetch(this.baseUrl + "/orders/" + order.id, { body: JSON.stringify(order), method: "PUT" });
    return response.json();
  }
}

export function useCommerce() {  
  return new CommerceApi();
}

