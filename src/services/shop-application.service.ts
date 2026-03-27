import { config } from "../config/index.js";
import { EVENT_TYPES, KafkaManager } from "../infra/kafka/index.js";
import ShopOwnerApplication from "../models/shop-application.model.js";
import { ApiError } from "../utils/ApiError.js";

export class ShopApplicationService {
    async getApplication(userId: string) {
        const application = await ShopOwnerApplication.findOne({ userId })
            .sort({ createdAt: -1 })
            .select("status rejectionReason rejectedAt reviewedAt reapplyCount createdAt");

        if (!application) {
            return { applied: false, message: "No shop owner application found" };
        }

        let canReapply = false;
        let retryAfterDays = 0;

        if (application.status === "rejected" && application.rejectedAt) {
            const COOLDOWN_DAYS = 7;
            const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
            const remainingMs = COOLDOWN_MS - (Date.now() - application.rejectedAt.getTime());

            if (remainingMs <= 0) {
                canReapply = true;
            } else {
                retryAfterDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
            }
        }

        return {
            applied: true,
            data: {
                applicationId: application.id,
                status: application.status,
                rejectionReason: application.rejectionReason,
                rejectedAt: application.rejectedAt,
                reviewedAt: application.reviewedAt,
                reapplyCount: application.reapplyCount,
                canReapply,
                retryAfterDays,
                appliedAt: application.createdAt,
            },
        };
    }

    async submitApplication(userId: string, data: any, files: any) {
        const COOLDOWN_DAYS = 7;
        const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

        const lastApplication = await ShopOwnerApplication.findOne({ userId }).sort({ createdAt: -1 });

        if (lastApplication) {
            if (["pending", "approved"].includes(lastApplication.status)) {
                throw new ApiError(409, `You have already applied (status: ${lastApplication.status})`);
            }

            if (lastApplication.status === "rejected") {
                if (!lastApplication.rejectedAt) throw new ApiError(400, "Re-apply not allowed yet");

                const remainingMs = COOLDOWN_MS - (Date.now() - lastApplication.rejectedAt.getTime());
                if (remainingMs > 0) {
                    const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
                    throw new ApiError(429, `You can re-apply after ${days} day(s)`);
                }
                await lastApplication.updateOne({ status: "superseded", supersededAt: new Date() });
            }
        }

        const images = files.images.map((file: any, index: number) => ({
            url: file.path,
            publicId: file.filename,
            alt: "Shop Image",
            isPrimary: index === 0,
        }));

        const documents = {
            license: files.license[0].path,
            gstCertificate: files.gstCertificate && files.gstCertificate.length > 0 ? files.gstCertificate[0].path : "",
        };

        const ownerDocuments = {
            identityProof: files.identityProof[0].path,
            panCard: files.panCard[0].path,
            ownerPhoto: files.ownerPhoto[0].path,
            addressProof: files.addressProof[0].path,
        };

        const application = await ShopOwnerApplication.create({
            userId,
            shopData: { ...data, images, documents },
            ownerDocuments,
            status: "pending",
            isReapply: Boolean(lastApplication),
            previousApplicationId: lastApplication?.id || null,
            reapplyCount: lastApplication ? (lastApplication.reapplyCount || 0) + 1 : 0,
        });

        return application;
    }

    async reviewApplication(applicationId: string, adminId: string, status: "approved" | "rejected", rejectionReason?: string) {
        const application = await ShopOwnerApplication.findOne({ id: applicationId });

        if (!application) throw new ApiError(404, "Application not found");
        if (application.status !== "pending") throw new ApiError(409, `Application already ${application.status}`);

        application.status = status;
        application.reviewedBy = adminId;
        application.reviewedAt = new Date();

        if (status === "rejected") {
            if (!rejectionReason) throw new ApiError(400, "Rejection reason is required");
            application.rejectionReason = rejectionReason;
            application.rejectedAt = new Date();
        } else {
            application.rejectionReason = undefined;
            application.rejectedAt = undefined;
        }

        await application.save();

        if (status === "approved") {
            const NEW_ROLE = "shop-owner";

            await KafkaManager.publish({
                topic: config.kafka.topics.userEvents,
                eventType: EVENT_TYPES.USER_SHOP_OWNER_ROLE_GRANTED,
                payload: { userId: application.userId.toString(), role: NEW_ROLE, email: application.shopData.contactInfo.email },
                metadata: { userId: application.userId.toString() },
            });

            await KafkaManager.publish({
                topic: config.kafka.topics.shopEvents,
                eventType: EVENT_TYPES.USER_SHOP_APPLICATION_APPROVED,
                payload: {
                    applicationId: application.id,
                    userId: application.userId.toString(),
                    email: application.shopData.contactInfo.email,
                    role: NEW_ROLE,
                    shopData: application.shopData,
                },
                metadata: { userId: application.userId.toString(), applicationId: application.id },
            });
        }

        return application;
    }
}

export const shopApplicationService = new ShopApplicationService();
