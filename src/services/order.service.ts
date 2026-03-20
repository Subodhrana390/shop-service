import axios, { AxiosInstance } from "axios";
import { config } from "../config/index.js";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

interface OrderResponse<T = any> {
  data: T;
}

class OrderService {
  private static instance: OrderService;

  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL: config.services.orderService,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "X-Service-Name": "medical-shop-service",
      },
    });
  }

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }


  async getShopOrders(shopId: string): Promise<any[]> {
    const { data } = await this.client.get<OrderResponse<any[]>>(
      `/api/v1/internal/orders/shop/${shopId}`
    );
    return data.data;
  }

  async getOrderDetails(orderId: string): Promise<any> {
    const { data } = await this.client.get<OrderResponse<any>>(
      `/api/v1/internal/orders/${orderId}`
    );
    return data.data;
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<any> {
    const { data } = await this.client.patch<OrderResponse<any>>(
      `/api/v1/internal/orders/${orderId}/status`,
      { status }
    );
    return data.data;
  }
}

export default OrderService.getInstance();