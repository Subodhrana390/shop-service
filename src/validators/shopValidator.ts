import { z } from "zod";

/* ------------------ COMMON ------------------ */

export const indianPhoneSchema = z
  .string()
  .regex(/^(\+91)?[6-9]\d{9}$/, "Must be a valid Indian number");

/* ------------------ ADDRESS ------------------ */

export const addressSchema = z.object({
  street: z.string().min(5, "Street address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  zipCode: z.string().regex(/^\d{6}$/, "ZIP code must be 6 digits"),
  country: z.string().default("India"),
  location: z
    .object({
      type: z.literal("Point").default("Point"),
      coordinates: z.tuple([
        z.number().min(-180).max(180), // longitude
        z.number().min(-90).max(90), // latitude
      ]),
    })
    .optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

/* ------------------ OPERATING HOURS ------------------ */

const dayScheduleSchema = z
  .object({
    open: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
      .optional(),
    close: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
      .optional(),
    isOpen: z.boolean().optional(),
  })
  .refine((data) => (data.isOpen ? Boolean(data.open && data.close) : true), {
    message: "Open and close time required when shop is open",
    path: ["open"],
  });

export const operatingHoursSchema = z
  .object({
    monday: dayScheduleSchema.optional(),
    tuesday: dayScheduleSchema.optional(),
    wednesday: dayScheduleSchema.optional(),
    thursday: dayScheduleSchema.optional(),
    friday: dayScheduleSchema.optional(),
    saturday: dayScheduleSchema.optional(),
    sunday: dayScheduleSchema.optional(),
  })
  .partial();

export type OperatingHoursInput = z.infer<typeof operatingHoursSchema>;

/* ------------------ CREATE SHOP ------------------ */

export const createShopSchema = z.object({
  name: z.string().min(3).max(100),
  licenseNumber: z.string().min(5).max(50),
  gstNumber: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST number format",
    )
    .optional(),

  contactInfo: z.object({
    phone: z.string().regex(/^\+91[6-9]\d{9}$/),
    alternatePhone: z
      .string()
      .regex(/^\+91[6-9]\d{9}$/)
      .optional(),
    email: z.string().email().optional(),
  }),

  address: addressSchema,
  operatingHours: operatingHoursSchema,

  description: z.string().max(500).optional(),

  services: z.array(
    z.enum([
      "24/7",
      "home-delivery",
      "online-ordering",
      "prescription-upload",
      "teleconsultation",
    ]),
  ),

  paymentMethods: z
    .array(z.enum(["cash", "card", "upi", "net-banking", "wallet"]))
    .min(1),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;

/* ------------------ UPDATE SHOP ------------------ */

export const updateShopSchema = z.object({
  contactInfo: z
    .object({
      phone: indianPhoneSchema.optional(),
      alternatePhone: indianPhoneSchema.or(z.literal("")).optional(),
      email: z.string().email().optional(),
    })
    .partial()
    .optional(),

  address: addressSchema.partial().optional(),
  operatingHours: operatingHoursSchema.optional(),
  description: z.string().max(500).optional(),

  services: z
    .array(
      z.enum([
        "24/7",
        "home-delivery",
        "online-ordering",
        "prescription-upload",
        "teleconsultation",
      ]),
    )
    .optional(),

  paymentMethods: z
    .array(z.enum(["cash", "card", "upi", "net-banking", "wallet"]))
    .optional(),
});

export type UpdateShopInput = z.infer<typeof updateShopSchema>;

/* ------------------ SEARCH ------------------ */

export const shopSearchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  services: z.array(z.string()).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(1).max(50).default(10),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(["distance", "rating", "name"]).default("distance"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ShopSearchQuery = z.infer<typeof shopSearchSchema>;

/* ------------------ STATUS UPDATE ------------------ */

export const updateShopStatusSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"]),
  reason: z.string().min(10).optional(),
});

export type UpdateShopStatusInput = z.infer<typeof updateShopStatusSchema>;
