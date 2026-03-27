import { config } from "../config/index.js";
import { EVENT_TYPES, KafkaManager } from "../infra/kafka/index.js";
import MedicalShop from "../models/Shop.js";
import { ShopSearchService } from "../services/shop-search.service.js";

/* ------------------ TYPES ------------------ */

interface UserShopApprovedEventData {
  userId: string;
  email: string;
  role: "shop-owner" | "admin" | "user";
  shopData?: {
    name: string;
    contactInfo?: {
      phone?: string;
      email?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

interface KafkaEvent<T = any> {
  type: string;
  data: T;
}

export class UserEventHandler {
  static async handle(
    event: KafkaEvent<UserShopApprovedEventData>,
  ): Promise<void> {
    const { data, type } = event;

    console.log(`📩 Received Kafka event: ${type}`);
    console.log("📦 Event data:", JSON.stringify(data, null, 2));

    try {
      switch (type) {
        case EVENT_TYPES.USER_SHOP_APPLICATION_APPROVED:
          console.log("🏪 Handling USER_SHOP_APPLICATION_APPROVED event...");
          await UserEventHandler.handleCreateShop(data);
          break;

        default:
          return;
      }
    } catch (error) {
      console.error("❌ Error handling user event:", error);
    }
  }

  private static async handleCreateShop(
    data: UserShopApprovedEventData,
  ): Promise<void> {
    const { userId, email, role, shopData } = data;

    if (role !== "shop-owner" || !shopData) return;

    console.log(`🏪 Processing shop creation for owner: ${userId}`);

    try {
      const newShopData = {
        ...shopData,
        ownerId: userId,
        verificationStatus: "verified",
        status: "active",
        contactInfo: {
          ...shopData.contactInfo,
          email: shopData.contactInfo?.email ?? email,
        },
      };

      const shop = await MedicalShop.create(newShopData);

      console.log(`✅ New shop created: ${shop.name}`);


      await ShopSearchService.indexShop(shop).catch(() => { });

      await KafkaManager.publish({
        topic: config.kafka.topics.shopEvents,
        eventType: EVENT_TYPES.SHOP_CREATED,
        payload: {
          shopId: shop._id.toString(),
          userId,
          role,
          email,
          shopName: shop.name,
        },
        metadata: { userId },
      });
    } catch (error) {
      console.error("❌ Failed to create shop from event:", error);
    }
  }
}
