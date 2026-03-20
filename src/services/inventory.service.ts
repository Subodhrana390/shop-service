import axios, { AxiosInstance } from "axios";
import { config } from "../config/index.js";

export interface StockMovementInput {
  type: "in" | "out" | "adjustment" | "return";
  quantity: number;
  reason: string;
  reference?: string | null;
  notes?: string | null;
  paymentMode?: "cash" | "online" | null;
}

export interface InventorySearchOptions {
  status?: string;
  lowStockOnly?: boolean;
  expiringSoon?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class InventoryService {
  private static instance: InventoryService;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL: config.services.inventoryService,
      timeout: 5000,
      headers: {
        "Content-Type": "application/json"
      },
    });
  }

  static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService();
    }
    return InventoryService.instance;
  }

  async getShopInventory(shopId: string): Promise<any[]> {
    const { data } = await this.client.get(
      `/api/v1/internal/inventory/shop/${shopId}`
    );
    return data.data;
  }

  async getInventoryAlerts(shopId: string): Promise<any> {
    const { data } = await this.client.get(
      `/api/v1/internal/inventory/shop/${shopId}/alerts`
    );
    return data.data;
  }

  async getInventoryStats(shopId: string): Promise<any> {
    const { data } = await this.client.get(
      `/api/v1/internal/inventory/shop/${shopId}/stats`
    );
    return data.data;
  }

  async addInventoryItem(itemData: any): Promise<any> {
    const { data } = await this.client.post(
      "/api/v1/internal/inventory",
      itemData
    );
    return data.data;
  }

  async updateStock(
    inventoryId: string,
    movementData: StockMovementInput
  ): Promise<any> {
    const { data } = await this.client.patch(
      `/api/v1/internal/inventory/${inventoryId}/stock`,
      movementData
    );
    return data.data;
  }

  async searchShopInventories(
    shopIds: string[],
    options: InventorySearchOptions = {}
  ): Promise<any> {
    const { data } = await this.client.post(
      "/api/v1/internal/inventory/search",
      {
        shopIds,
        ...options,
      }
    );
    return data;
  }
}

export default InventoryService.getInstance();