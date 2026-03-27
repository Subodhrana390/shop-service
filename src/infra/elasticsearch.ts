import { Client } from "@opensearch-project/opensearch";
import dotenv from "dotenv";
import { config } from "../config/index.js";

dotenv.config();

const esClient = new Client({
    node: config.elasticSearch.node,
    maxRetries: 5,
    requestTimeout: 60000,
    sniffOnStart: true,
});

export const checkConnection = async () => {
    try {
        const health = await esClient.cluster.health({});
        console.log(
            `✅ OpenSearch connected (shop-service): ${health.body.status}`
        );
        return true;
    } catch (error) {
        console.error(
            "❌ OpenSearch connection failed (shop-service):",
            error
        );
        return false;
    }
};

export default esClient;