import { Document } from "mongoose";

export interface ILocation {
    type: "Point";
    coordinates: number[];
}

export interface IAddress {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    location: ILocation;
}

export interface IOwnerDocuments {
    identityProof: string;
    panCard: string;
    ownerPhoto: string;
    addressProof: string;
}

export interface IShopDocuments {
    license: string;
    gstCertificate: string;
}

export interface IShopImage {
    url: string;
    alt?: string;
    isPrimary?: boolean;
}

export interface IShopData {
    name: string;
    licenseNumber: string;
    gstNumber?: string;
    contactInfo: {
        phone: string;
        alternatePhone?: string;
        email?: string;
    };
    address: IAddress;
    images: IShopImage[];
    services: ("24/7" | "home-delivery" | "online-ordering" | "prescription-upload" | "teleconsultation")[];
    documents: IShopDocuments;
}

export interface IShopApplication extends Document {
    id: string;
    userId: string;
    ownerDocuments: IOwnerDocuments;
    shopData: IShopData;
    status: "pending" | "approved" | "rejected" | "superseded";
    reviewedBy?: string;
    reviewedAt?: Date;
    rejectionReason?: string;
    rejectedAt?: Date;
    isReapply: boolean;
    previousApplicationId?: string;
    reapplyCount: number;
    createdAt: Date;
    updatedAt: Date;
}
