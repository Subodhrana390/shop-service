import axios, { AxiosInstance } from "axios";
import { config } from "config/index.js";

export interface NewMedicineRequest {
    [key: string]: any;
}

class AdminService {
    private static instance: AdminService;

    private client: AxiosInstance;

    private constructor() {
        this.client = axios.create({
            baseURL: config.services.adminService,
            timeout: 5000,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    static getInstance(): AdminService {
        if (!AdminService.instance) {
            AdminService.instance = new AdminService();
        }
        return AdminService.instance;
    }

    async requestNewMedicine(
        requestData: NewMedicineRequest
    ): Promise<any> {
        const { data } = await this.client.post(
            "/api/v1/internal/admin/medicine-requests",
            requestData
        );

        return data;
    }
}

export default AdminService.getInstance();