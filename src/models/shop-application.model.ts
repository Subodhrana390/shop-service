import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { IAddress, ILocation, IOwnerDocuments, IShopApplication, IShopData, IShopDocuments, IShopImage } from "../infra/kafka/interfaces/shop-application.interface.js";

const locationSchema = new Schema<ILocation>(
    {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    { _id: false },
);

const addressSchema = new Schema<IAddress>(
    {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        postalCode: { type: String, required: true, trim: true },
        country: { type: String, default: "India" },
        location: locationSchema
    },
    { _id: false },
);

const ownerDocumentsSchema = new Schema<IOwnerDocuments>(
    {
        identityProof: { type: String, required: true },
        panCard: { type: String, required: true },
        ownerPhoto: { type: String, required: true },
        addressProof: { type: String, required: true },
    },
    { _id: false },
);

const documentsSchema = new Schema<IShopDocuments>(
    {
        license: { type: String, required: true },
        gstCertificate: { type: String, required: true },
    },
    { _id: false },
);

const imageSchema = new Schema<IShopImage>(
    {
        url: { type: String, required: true },
        alt: { type: String, default: "" },
        isPrimary: { type: Boolean, default: false },
    },
    { _id: false },
);

const shopDataSchema = new Schema<IShopData>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        licenseNumber: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        gstNumber: {
            type: String,
            trim: true,
        },

        contactInfo: {
            phone: { type: String, required: true, trim: true },
            alternatePhone: { type: String, trim: true },
            email: {
                type: String,
                trim: true,
                lowercase: true,
                match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            },
        },

        address: {
            type: addressSchema,
            required: true,
        },

        images: {
            type: [imageSchema],
            validate: {
                validator: (v: any[]) => Array.isArray(v) && v.length > 0,
                message: "At least one shop image is required",
            },
        },

        services: {
            type: [String],
            enum: [
                "24/7",
                "home-delivery",
                "online-ordering",
                "prescription-upload",
                "teleconsultation",
            ],
            required: true,
        },

        documents: {
            type: documentsSchema,
            required: true,
        },
    },
    { _id: false },
);

const shopApplicationSchema = new Schema<IShopApplication>(
    {
        id: {
            type: String,
            default: uuidv4,
            unique: true,
            index: true,
        },
        userId: {
            type: String,
            index: true,
        },

        ownerDocuments: {
            type: ownerDocumentsSchema,
            required: true,
        },

        shopData: {
            type: shopDataSchema,
            required: true,
        },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "superseded"],
            default: "pending",
            index: true,
        },

        /* ---------- REVIEW ---------- */
        reviewedBy: {
            type: String,
        },

        reviewedAt: {
            type: Date,
        },

        /* ---------- REJECTION & RE-APPLY ---------- */
        rejectionReason: {
            type: String,
            trim: true,
        },

        rejectedAt: {
            type: Date,
        },

        isReapply: {
            type: Boolean,
            default: false,
        },

        previousApplicationId: {
            type: String
        },

        reapplyCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                const { _id, ...rest } = ret;
                return rest;
            },
        },

        toObject: {
            virtuals: true,
            transform: (_doc, ret) => {
                const { _id, ...rest } = ret;
                return rest;
            },
        },
    },
);

/* ---------------- INDEXES ---------------- */
shopApplicationSchema.index({ userId: 1, createdAt: -1 });
shopApplicationSchema.index({ status: 1, createdAt: -1 });
shopApplicationSchema.index({ "address.coordinates": "2dsphere" });

/* ---------------- MODEL ---------------- */
const ShopOwnerApplication = mongoose.model<IShopApplication>(
    "ShopOwnerApplication",
    shopApplicationSchema,
);

export default ShopOwnerApplication;
