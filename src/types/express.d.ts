declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: "admin" | "shop-owner" | "user";
            };
            shop?: {
                id: string;
                ownerId: string;
            };
        }
    }
}

export { };