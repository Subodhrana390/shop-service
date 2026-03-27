import axios, { AxiosInstance } from "axios";
import { config } from "../config/index.js";

/* ------------------ SERVICE ------------------ */

class PayoutService {
  private static instance: PayoutService;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL: config.services.payoutService,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "X-Service-Name": "payout-service",
      },
    });
  }

  /* ------------------ SINGLETON ------------------ */

  static getInstance(): PayoutService {
    if (!PayoutService.instance) {
      PayoutService.instance = new PayoutService();
    }
    return PayoutService.instance;
  }

  /* ------------------ API METHODS ------------------ */

  async getShopPayoutStats(shopId: string): Promise<any> {
    const { data } = await this.client.get(
      `/api/v1/internal/payouts/shop/${shopId}/stats`
    );
    return data.data;
  }

  async getShopPayouts(shopId: string): Promise<any[]> {
    const { data } = await this.client.get(
      `/api/v1/internal/payouts/shop/${shopId}`
    );
    return data.data;
  }

  async releasePayout(payoutId: string): Promise<any> {
    const { data } = await this.client.put(
      `/api/v1/internal/payouts/${payoutId}/release`
    );
    return data.data;
  }
}

/* ------------------ EXPORT SINGLETON ------------------ */

export default PayoutService.getInstance();