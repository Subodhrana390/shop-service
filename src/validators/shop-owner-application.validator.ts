import { z } from "zod";

const parseJSON = (value: any) => {
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
    return value;
};

const contactInfoSchema = z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/),
    alternatePhone: z.string().optional(),
    email: z.string().email().optional(),
});

export const addressSchema = z.object({
    street: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    zipCode: z.string().min(4),
    country: z.string().default("India"),
    location: z
        .object({
            type: z.literal("Point").default("Point"),
            coordinates: z.tuple([
                z.number().min(-180).max(180),
                z.number().min(-90).max(90),
            ]),
        })
        .optional(),
});

export const shopDataSchema = z.object({
    name: z.string().min(3).max(100),
    licenseNumber: z.string().min(3),
    gstNumber: z.string().optional(),
    contactInfo: z.preprocess(parseJSON, contactInfoSchema),

    address: z.preprocess(parseJSON, addressSchema),

    services: z.preprocess(
        parseJSON,
        z
            .array(
                z.enum([
                    "24/7",
                    "home-delivery",
                    "online-ordering",
                    "prescription-upload",
                    "teleconsultation",
                ]),
            )
            .min(1),
    ),
});

const singleFile = z.array(z.any()).length(1);

export const shopOwnerFilesZodSchema = z.object({
    // Owner documents
    identityProof: singleFile,
    panCard: singleFile,
    ownerPhoto: singleFile,
    addressProof: singleFile,

    // Shop documents
    license: singleFile,
    gstCertificate: singleFile,

    // Shop images
    images: singleFile,
});

export const reviewApplicationSchema = z.object({
    status: z.enum(["approved", "rejected"]),
    rejectionReason: z.string().optional(),
}).refine(data => {
    if (data.status === "rejected" && !data.rejectionReason) {
        return false;
    }
    return true;
}, {
    message: "Rejection reason is required when status is rejected",
    path: ["rejectionReason"],
});

export type ShopDataInput = z.infer<typeof shopDataSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
