import { z } from "zod";

/* ------------------ ENUMS ------------------ */

export const INVENTORY_UNIT_ENUM = z.enum([
  "tablets",
  "capsules",
  "bottles",
  "tubes",
  "packs",
  "strips",
  "vials",
  "pieces",
]);

export const STOCK_MOVEMENT_TYPE_ENUM = z.enum([
  "in",
  "out",
  "adjustment",
  "return",
]);

export const STOCK_MOVEMENT_REASON_ENUM = z.enum([
  "purchase",
  "sale",
  "transfer_in",
  "transfer_out",
  "damage",
  "expiry",
  "loss",
  "correction",
  "customer_return",
  "supplier_return",
  "opening_stock",
]);

export const INVENTORY_STATUS_ENUM = z.enum([
  "active",
  "expired",
  "damaged",
  "returned",
  "out-of-stock",
]);

/* ------------------ PRICING ------------------ */

export const pricingSchema = z.object({
  costPrice: z.number().min(0.01),
  sellingPrice: z.number().min(0.01),
  mrp: z.number().min(0.01),
  discountPercentage: z.number().min(0).max(100).default(0),
  taxPercentage: z.number().min(0).max(100).default(0),
});

export type PricingInput = z.infer<typeof pricingSchema>;

/* ------------------ SUPPLIER ------------------ */

export const supplierSchema = z.object({
  name: z.string().min(2).max(100),
  contact: z.string().min(10).optional(),
  invoiceNumber: z.string().min(1).optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

/* ------------------ LOCATION ------------------ */

export const locationSchema = z.object({
  rack: z.string().max(20).optional(),
  shelf: z.string().max(20).optional(),
  bin: z.string().max(20).optional(),
});

export type LocationInput = z.infer<typeof locationSchema>;

/* ------------------ CREATE INVENTORY ------------------ */

export const createInventorySchema = z
  .object({
    medicineId: z.string().min(1),
    batchNumber: z.string().min(1).max(50),

    quantity: z.number().min(0),

    unit: INVENTORY_UNIT_ENUM.default("pieces"),

    pricing: pricingSchema,

    supplier: supplierSchema.optional(),

    manufacturingDate: z.string().transform((v) => new Date(v)),
    expiryDate: z.string().transform((v) => new Date(v)),

    location: locationSchema.optional(),

    alerts: z
      .object({
        lowStockThreshold: z.number().min(0).default(10),
        expiryAlertDays: z.number().min(0).default(30),
      })
      .optional(),
  })
  .refine(
    (data) => data.expiryDate > data.manufacturingDate,
    {
      message: "Expiry date must be after manufacturing date",
      path: ["expiryDate"],
    }
  )
  .refine(
    (data) => data.pricing.sellingPrice <= data.pricing.mrp,
    {
      message: "Selling price cannot exceed MRP",
      path: ["pricing", "sellingPrice"],
    }
  );

export type CreateInventoryInput = z.infer<
  typeof createInventorySchema
>;

/* ------------------ UPDATE INVENTORY ------------------ */

export const updateInventorySchema = z.object({
  pricing: pricingSchema.optional(),
  location: locationSchema.optional(),
  alerts: z
    .object({
      lowStockThreshold: z.number().min(0).default(10),
      expiryAlertDays: z.number().min(0).default(30),
    })
    .optional(),
});

export type UpdateInventoryInput = z.infer<
  typeof updateInventorySchema
>;

/* ------------------ STOCK MOVEMENT ------------------ */

export const stockMovementSchema = z
  .object({
    type: STOCK_MOVEMENT_TYPE_ENUM,
    quantity: z.number().int(),
    reason: STOCK_MOVEMENT_REASON_ENUM,
    reference: z.string().max(50).optional().nullable(),
    notes: z.string().max(200).optional().nullable(),
    paymentMode: z.enum(["cash", "online"]).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Quantity rules
    if (data.type !== "adjustment" && data.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Quantity must be greater than zero for this movement type",
        path: ["quantity"],
      });
    }

    if (data.type === "adjustment" && data.quantity === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Adjustment quantity cannot be zero",
        path: ["quantity"],
      });
    }

    // Reason vs type validation
    const validReasonsByType: Record<
      z.infer<typeof STOCK_MOVEMENT_TYPE_ENUM>,
      z.infer<typeof STOCK_MOVEMENT_REASON_ENUM>[]
    > = {
      in: ["purchase", "transfer_in", "opening_stock"],
      out: ["sale", "transfer_out", "damage", "expiry", "loss"],
      adjustment: ["correction"],
      return: ["customer_return", "supplier_return"],
    };

    if (!validReasonsByType[data.type].includes(data.reason)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid reason "${data.reason}" for movement type "${data.type}"`,
        path: ["reason"],
      });
    }

    // Sale requires payment mode
    if (data.reason === "sale" && !data.paymentMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Payment mode is required for sale transactions",
        path: ["paymentMode"],
      });
    }
  });

export type StockMovementInput = z.infer<
  typeof stockMovementSchema
>;

/* ------------------ BULK UPDATE ------------------ */

export const bulkInventoryUpdateSchema = z.object({
  items: z
    .array(
      z.object({
        medicineId: z.string().min(1),
        batchNumber: z.string().min(1),
        quantity: z.number().min(0),
        pricing: pricingSchema.optional(),
      })
    )
    .min(1)
    .max(50),
});

export type BulkInventoryUpdateInput = z.infer<
  typeof bulkInventoryUpdateSchema
>;

/* ------------------ SEARCH ------------------ */

export const inventorySearchSchema = z.object({
  medicineId: z.string().optional(),
  status: INVENTORY_STATUS_ENUM.optional(),

  lowStockOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),

  expiringSoon: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),

  daysAhead: z.coerce.number().min(1).max(365).default(30),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),

  sortBy: z
    .enum(["quantity", "expiryDate", "createdAt"])
    .default("expiryDate"),

  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type InventorySearchQuery = z.infer<
  typeof inventorySearchSchema
>;

/* ------------------ ALERT SETTINGS ------------------ */

export const updateAlertSettingsSchema = z.object({
  lowStockThreshold: z.number().min(0),
  expiryAlertDays: z.number().min(0),
});

export type UpdateAlertSettingsInput = z.infer<
  typeof updateAlertSettingsSchema
>;

/* ------------------ CURSOR PAGINATION ------------------ */

export const inventoryCursorQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().datetime().optional(),
});

export type InventoryCursorQuery = z.infer<
  typeof inventoryCursorQuerySchema
>;