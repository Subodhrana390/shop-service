import { z } from "zod";

/* ------------------ NORMALIZERS ------------------ */

const normalizeString = (v: unknown) =>
  typeof v === "string" ? v.trim().toLowerCase() : v;

const normalizeUnit = (v: unknown) =>
  typeof v === "string" ? v.trim() : v;

/* ------------------ ENUMS ------------------ */

export const UNIT_ENUM = z.enum([
  "mg",
  "ml",
  "mcg",
  "g",
  "IU",
  "%",
  "units",
]);

export const DOSAGE_FORM_ENUM = z.enum([
  "tablet",
  "capsule",
  "syrup",
  "injection",
  "cream",
  "ointment",
  "drops",
  "powder",
  "gel",
  "lozenge",
  "inhaler",
  "patch",
]);

export const MEDICINE_CATEGORY_ENUM = z.enum([
  "analgesic",
  "antibiotic",
  "antiviral",
  "antifungal",
  "antihistamine",
  "antihypertensive",
  "antidiabetic",
  "cardiovascular",
  "respiratory",
  "gastrointestinal",
  "neurological",
  "psychiatric",
  "dermatological",
  "ophthalmic",
  "otolaryngology",
  "dental",
  "endocrine",
  "urological",
  "gynecological",
  "pediatric",
  "geriatric",
  "veterinary",
  "supplement",
  "herbal",
  "homeopathic",
  "ayurvedic",
  "other",
]);

export const MEDICINE_SCHEDULE_ENUM = z.enum([
  "schedule-h",
  "schedule-h1",
  "schedule-x",
  "otc",
]);

/* ------------------ DOSAGE FORM ------------------ */

export const dosageFormSchema = z.object({
  form: z
    .string()
    .transform(normalizeString)
    .pipe(DOSAGE_FORM_ENUM),

  strength: z.string().min(1, "Strength is required"),

  unit: z
    .string()
    .transform(normalizeUnit)
    .pipe(UNIT_ENUM)
    .default("mg"),
});

export type DosageFormInput = z.infer<typeof dosageFormSchema>;

/* ------------------ COMPOSITION ------------------ */

export const compositionSchema = z.object({
  ingredient: z.string().min(1),

  strength: z.string().optional(),

  unit: z
    .string()
    .transform(normalizeUnit)
    .pipe(UNIT_ENUM)
    .default("mg"),
});

export type CompositionInput = z.infer<typeof compositionSchema>;

/* ------------------ CREATE MEDICINE ------------------ */

export const createMedicineSchema = z.object({
  name: z.string().min(2).max(200),
  genericName: z.string().max(200).optional(),
  brand: z.string().max(100).optional(),

  manufacturer: z.string().min(2).max(100),

  category: z
    .string()
    .transform(normalizeString)
    .pipe(MEDICINE_CATEGORY_ENUM),

  subcategory: z.string().optional(),

  dosageForms: z
    .array(dosageFormSchema)
    .min(1, "At least one dosage form is required"),

  composition: z.array(compositionSchema).optional(),

  prescriptionRequired: z.coerce.boolean().default(false),

  schedule: z
    .string()
    .transform(normalizeString)
    .pipe(MEDICINE_SCHEDULE_ENUM)
    .default("otc"),

  description: z.string().max(1000).optional(),
  indications: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  sideEffects: z.array(z.string()).optional(),

  dosageInstructions: z.string().max(500).optional(),
  storageInstructions: z.string().max(300).optional(),

  shelfLife: z.coerce.number().min(1).max(120).optional(),

  barcodes: z.array(z.string()).optional(),

  regulatoryInfo: z
    .object({
      drugLicenseNumber: z.string().optional(),
      approvalDate: z
        .string()
        .transform((v) => new Date(v))
        .optional(),
      fdaApproved: z.coerce.boolean().default(false),
    })
    .optional(),

  tags: z.array(z.string()).optional(),
});

export type CreateMedicineInput = z.infer<
  typeof createMedicineSchema
>;

/* ------------------ UPDATE MEDICINE ------------------ */

export const updateMedicineSchema = z
  .object({
    name: z.string().min(2).max(200),
    genericName: z.string().max(200).optional(),
    brand: z.string().max(100).optional(),
    manufacturer: z.string().min(2).max(100),

    category: z
      .string()
      .transform(normalizeString)
      .pipe(MEDICINE_CATEGORY_ENUM),

    subcategory: z.string().optional(),

    dosageForms: z.array(dosageFormSchema).min(1),
    composition: z.array(compositionSchema).optional(),

    prescriptionRequired: z.coerce.boolean(),

    schedule: z
      .string()
      .transform(normalizeString)
      .pipe(MEDICINE_SCHEDULE_ENUM),

    description: z.string().max(1000).optional(),
    indications: z.array(z.string()).optional(),
    contraindications: z.array(z.string()).optional(),
    sideEffects: z.array(z.string()).optional(),

    dosageInstructions: z.string().max(500).optional(),
    storageInstructions: z.string().max(300).optional(),

    shelfLife: z.coerce.number().min(1).max(120),

    barcodes: z.array(z.string()).optional(),

    regulatoryInfo: z
      .object({
        drugLicenseNumber: z.string().optional(),
        approvalDate: z
          .string()
          .transform((v) => new Date(v))
          .optional(),
        fdaApproved: z.coerce.boolean(),
      })
      .optional(),

    tags: z.array(z.string()).optional(),

    status: z
      .enum(["active", "discontinued", "out-of-stock"])
      .optional(),
  })
  .partial();

export type UpdateMedicineInput = z.infer<
  typeof updateMedicineSchema
>;

/* ------------------ SEARCH ------------------ */

export const medicineSearchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  prescriptionRequired: z.boolean().optional(),

  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),

  sortBy: z
    .enum(["name", "createdAt", "updatedAt"])
    .default("name"),

  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type MedicineSearchQuery = z.infer<
  typeof medicineSearchSchema
>;

/* ------------------ BULK IMPORT ------------------ */

export const bulkImportSchema = z.object({
  medicines: z
    .array(createMedicineSchema)
    .min(1)
    .max(100),
});

export type BulkImportInput = z.infer<
  typeof bulkImportSchema
>;