export interface Config {
    env: string;
    isProduction: boolean;
    service: {
        port: number;
    };
    mongodb: {
        uri: string;
    };
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessTokenExpireIn: string;
        refreshTokenExpireIn: string;
    };
    kafka: {
        brokers: string;
        clientId: string;
        groupId: string;
        retries: number;
        retryDelay: number;
        ssl: boolean | { rejectUnauthorized: boolean; ca?: string[] };
        sasl: {
            mechanism: "plain" | "scram-sha-256" | "scram-sha-512",
            username: string;
            password: string;
        };
        connectionTimeout: number;
        requestTimeout: number;
        topics: {
            userEvents: string;
            shopEvents: string;
            orderEvents: string;
            paymentEvents: string;
            deliveryEvents: string;
        };
    };
    redis: {
        uri: string;
    };
    elasticSearch: {
        node: string;
    };
    cloudinary: {
        cloudname: string;
        apiKey: string;
        apiSecret: string;
    };
    razorpay: {
        keyId: string;
        keySecret: string;
        webhookSecret: string;
    };
    services: {
        userService: string;
        adminService: string;
        shopService: string;
        orderService: string;
        inventoryService: string;
        payoutService: string;
    };
}
