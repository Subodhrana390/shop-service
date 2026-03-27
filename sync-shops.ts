import mongoose from "mongoose";
import { config } from "./src/config/index.js";
import MedicalShop from "./src/models/Shop.js";
import { ShopSearchService } from "./src/services/shop-search.service.js";

const MONGO_URI = config.mongodb.uri;

async function syncShops() {
  try {
    console.log(`📡 Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB.");

    console.log("🛠️ Initializing Elasticsearch index...");
    await ShopSearchService.initIndex();

    console.log("🔍 Fetching active and verified shops from database...");
    const shops = await MedicalShop.find({
      status: "active",
      verificationStatus: "verified",
    });

    console.log(
      `📦 Found ${shops.length} shops to sync. Starting sync process...`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const shop of shops) {
      try {
        await ShopSearchService.indexShop(shop);
        successCount++;
        console.log(`✅ Synced shop: ${shop.id} (${shop.name})`);
      } catch (err: any) {
        failCount++;
        console.error(
          `❌ Failed to sync shop: ${shop.id} (${shop.name})`,
          err.message,
        );
      }
    }

    console.log("\n🎉 Sync Process Completed!");
    console.log(
      `Total: ${shops.length}, Success: ${successCount}, Failed: ${failCount}`,
    );
  } catch (error) {
    console.error("❌ Critical error during sync:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB. Exiting.");
    process.exit(0);
  }
}

syncShops();
