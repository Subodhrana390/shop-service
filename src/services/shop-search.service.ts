import { IShop } from "models/Shop.js";
import esClient from "../infra/elasticsearch.js";
import redisClient from "../infra/redis/redisClient.js";

const SHOP_INDEX = "shops";

export class ShopSearchService {

  static async initIndex() {
    try {
      const { body: exists } =
        await esClient.indices.exists({ index: SHOP_INDEX });

      if (!exists) {
        await esClient.indices.create({
          index: SHOP_INDEX,
          body: {
            mappings: {
              properties: {
                id: { type: "keyword" },
                name: { type: "text" },
                status: { type: "keyword" },
                verificationStatus: { type: "keyword" },
                location: { type: "geo_point" },
                address: { type: "object", enabled: false },
                rating: { type: "float" },
                createdAt: { type: "date" },
                updatedAt: { type: "date" },
              },
            },
          },
        });

        console.log(`✅ Elasticsearch index '${SHOP_INDEX}' created`);
      }

    } catch (error) {
      console.error(
        "❌ Elasticsearch shop index initialization failed:",
        error
      );
    }
  }


  static async indexShop(shop: IShop) {
    try {
      const coords = shop.address?.location?.coordinates;

      if (!coords) return;

      /**
       * GeoJSON format: [lng, lat]
       */
      const [lng, lat] = coords;

      await esClient.index({
        index: SHOP_INDEX,
        id: shop.id,
        body: {
          id: shop.id,
          name: shop.name,
          status: shop.status,
          verificationStatus: shop.verificationStatus,
          location: { lat, lon: lng },
          address: shop.address,
          rating: shop.ratings?.average ?? 0,
          createdAt: shop.createdAt,
          updatedAt: shop.updatedAt,
        },
        refresh: false,
      });


      /**
       * Redis GEO index
       */
      await redisClient.geoadd(
        "shops:geo",
        lng,
        lat,
        shop.id
      );

    } catch (error) {
      console.error(
        `❌ Elasticsearch/Redis indexing failed for shop ${shop.id}:`,
        error
      );
    }
  }


  static async deleteShop(shopId: string) {
    try {

      await esClient.delete({
        index: SHOP_INDEX,
        id: shopId,
      });

      await redisClient.zrem("shops:geo", shopId);

    } catch (error) {
      console.error(
        `❌ Elasticsearch/Redis deletion failed for shop ${shopId}:`,
        error
      );
    }
  }
}