import axios, { AxiosInstance } from "axios";
import pMap from "p-map";

interface CachedUser {
    user: any;
    expiry: number;
}

class UserService {
    private static instance: UserService;

    private client: AxiosInstance;
    private cache: Map<string, CachedUser>;
    private cacheTTL: number;
    private chunkSize: number;
    private concurrency: number;

    private constructor() {
        this.client = axios.create({
            baseURL:
                process.env.APP_USER_SERVICE_URL ||
                "http://localhost:3002",
            timeout: 5000,
            headers: {
                "Content-Type": "application/json",
            },
        });

        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        this.chunkSize = 100;
        this.concurrency = 3;
    }

    static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    async getUsersByIds(userIds: string[]): Promise<any[]> {
        if (!Array.isArray(userIds) || userIds.length === 0) return [];

        const now = Date.now();
        const cachedUsers: any[] = [];
        const idsToFetch: string[] = [];

        for (const id of userIds) {
            const cached = this.cache.get(id);
            if (cached && cached.expiry > now) {
                cachedUsers.push(cached.user);
            } else {
                idsToFetch.push(id);
            }
        }

        const fetchedUsers: any[] = [];

        if (idsToFetch.length > 0) {
            const chunks: string[][] = [];
            for (let i = 0; i < idsToFetch.length; i += this.chunkSize) {
                chunks.push(idsToFetch.slice(i, i + this.chunkSize));
            }

            await pMap(
                chunks,
                async (chunk) => {
                    const { data } = await this.client.post("/api/v1/internal/users/bulk", {
                        userIds: chunk,
                    });

                    for (const user of data.users) {
                        fetchedUsers.push(user);
                        this.cache.set(user.userId, {
                            user,
                            expiry: now + this.cacheTTL,
                        });
                    }
                },
                { concurrency: this.concurrency }
            );
        }

        return [...cachedUsers, ...fetchedUsers];
    }

    async getUserById(userId: string): Promise<any | null> {
        const users = await this.getUsersByIds([userId]);
        return users[0] || null;
    }
}


export default UserService.getInstance();