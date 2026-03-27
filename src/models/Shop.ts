import mongoose, { Document, Model, Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface ILocation {
  type: "Point";
  coordinates: [number, number];
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  location: ILocation;
}

export interface IDayHours {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface IOperatingHours {
  monday: IDayHours;
  tuesday: IDayHours;
  wednesday: IDayHours;
  thursday: IDayHours;
  friday: IDayHours;
  saturday: IDayHours;
  sunday: IDayHours;
}

export interface IImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface IContactInfo {
  phone?: string;
  alternatePhone?: string;
  email?: string;
}

export interface IRatings {
  average: number;
  count: number;
}

export interface IBankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
}

export interface IDocuments {
  license?: string;
  gstCertificate?: string;
  addressProof?: string;
}

export interface IShop extends Document {
  id: string;
  name: string;
  ownerId: string;
  licenseNumber: string;
  gstNumber?: string;
  contactInfo: IContactInfo;
  address: IAddress;
  operatingHours: IOperatingHours;
  description?: string;
  images: IImage[];
  services: string[];
  ratings: IRatings;
  status: "pending" | "active" | "inactive" | "suspended";
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  verificationNote?: string;
  documents: IDocuments;
  bankDetails?: IBankDetails;
  paymentMethods: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  fullAddress: string;
  isOpenNow(): boolean;
}

const addressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: "India" },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
});

const dayHoursSchema = new Schema<IDayHours>(
  {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "21:00" },
    isOpen: { type: Boolean, default: true },
  },
  { _id: false },
);

const operatingHoursSchema = new Schema<IOperatingHours>(
  {
    monday: { type: dayHoursSchema, default: () => ({}) },
    tuesday: { type: dayHoursSchema, default: () => ({}) },
    wednesday: { type: dayHoursSchema, default: () => ({}) },
    thursday: { type: dayHoursSchema, default: () => ({}) },
    friday: { type: dayHoursSchema, default: () => ({}) },
    saturday: { type: dayHoursSchema, default: () => ({}) },
    sunday: {
      type: dayHoursSchema,
      default: () => ({ isOpen: false, open: "10:00", close: "18:00" }),
    },
  },
  { _id: false },
);

const medicalShopSchema = new Schema<IShop>(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      maxlength: [100, "Shop name cannot exceed 100 characters"],
    },

    ownerId: {
      type: String,
      required: [true, "Owner ID is required"],
    },

    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
    },

    gstNumber: {
      type: String,
      trim: true,
      sparse: true,
    },

    contactInfo: {
      phone: {
        type: String,
        trim: true,
      },
      alternatePhone: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
          validator: function (v: string) {
            return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: "Invalid email format",
        },
      },
    },

    address: addressSchema,

    operatingHours: operatingHoursSchema,

    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },

    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: "" },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    services: [
      {
        type: String,
        enum: [
          "24/7",
          "home-delivery",
          "online-ordering",
          "prescription-upload",
          "teleconsultation",
        ],
        trim: true,
      },
    ],

    ratings: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended"],
      default: "pending",
    },

    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    verificationNote: {
      type: String,
      trim: true,
    },

    documents: {
      license: { type: String },
      gstCertificate: { type: String },
      addressProof: { type: String },
    },
    bankDetails: {
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
    },

    paymentMethods: [
      {
        type: String,
        enum: ["cash", "card", "upi", "net-banking", "wallet"],
        default: ["cash"],
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        const { _id, ...rest } = ret;
        return rest;
      },
    },

    toObject: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        const { _id, ...rest } = ret;
        return rest;
      },
    },
  },
);

medicalShopSchema.index({ "address.location": "2dsphere" });
medicalShopSchema.index({ name: "text", description: "text" });
medicalShopSchema.index({ ownerId: 1 });
medicalShopSchema.index({ status: 1 });
medicalShopSchema.index({ verificationStatus: 1 });
medicalShopSchema.index({ "ratings.average": -1 });

medicalShopSchema.methods.isOpenNow = function (this: IShop) {
  const now = new Date();

  const dayName = now
    .toLocaleString("en-US", { weekday: "long" })
    .toLowerCase() as keyof IOperatingHours;

  const currentTime = now.toTimeString().slice(0, 5);

  const todayHours = this.operatingHours?.[dayName];
  if (!todayHours || !todayHours.isOpen) return false;

  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

const Shop: Model<IShop> = mongoose.model<IShop>(
  "MedicalShop",
  medicalShopSchema,
);
export default Shop;
