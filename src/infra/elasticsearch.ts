import { Client } from "@elastic/elasticsearch";
import { config } from "../config/index.js";
import dotenv from "dotenv";

dotenv.config();

const esClient = new Client({
    node: config.elasticSearch.node|| "http://172.20.32.1:9200",
});

export const checkConnection = async () => {
    try {
        const health = await esClient.cluster.health({});
        console.log("✅ Elasticsearch connected (shop-service):", health.status);
        return true;
    } catch (error) {
        console.error("❌ Elasticsearch connection failed (shop-service):", error);
        return false;
    }
};

export default esClient;
