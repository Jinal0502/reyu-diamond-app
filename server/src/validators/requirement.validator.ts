import {z} from "zod";

const requiredString = (fieldName : string, maxLen : number = 100) => 
    z.preprocess(
        (val) => (val === undefined || val === null ? "" : val),
        z.string().min(1 , `${fieldName} is required`).max(maxLen , `${fieldName} cannot exceed ${maxLen} characters`)
    );

const requiredArray = (fieldName : string) =>
    z.preprocess(
    (val) => (val === undefined || val === null ? [] : val),
    z.array(z.string()).min(1, `${fieldName} is required`)
  );

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/ , "Invalid ID");

const intentSchema = z.object({
  shape: requiredArray("Shape"),

  carat: z.object({
    min: z
      .number({ message: "Carat min is required" })
      .min(0, "Carat min cannot be negative"),

    max: z
      .number({ message: "Carat max is required" })
      .min(0, "Carat max cannot be negative"),
  })
  .refine((data) => data.max >= data.min, {
    message: "Carat max must be greater than or equal to min",
    path: ["max"],
  }),

  color: requiredArray("Color"),
  clarity: requiredArray("Clarity"),

  lab: z.boolean({ message: "Lab field is required" }),

  labName: z.array(z.string()).optional(),
});

const constraintsSchema = z.object({
  budget: z
    .number({ message: "Budget is required" })
    .min(0, "Budget cannot be negative"),

  currency: requiredString("Currency", 10),

  location: requiredArray("Location"),

  pricePerCarat: z
    .object({
      min: z.number().min(0, "Price per carat min cannot be negative").optional(),
      max: z.number().min(0, "Price per carat max cannot be negative").optional(),
    })
    .optional()
    .refine(
      (data) => {
        if (!data) return true;
        if (data.min !== undefined && data.max !== undefined) {
          return data.max >= data.min;
        }
        return true;
      },
      {
        message: "Price per carat max must be greater than or equal to min",
        path: ["max"],
      }
    ),
});

const preferencesSchema = z.object({
  cut: z.array(z.string()).optional(),
  polish: z.array(z.string()).optional(),
  symmetry: z.array(z.string()).optional(),
  fluorescence: z.array(z.string()).optional(),
  certificate: z.array(z.string()).optional(),

  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),

  priority: z.number().min(0, "Priority cannot be negative").optional(),

  isActive: z.boolean().optional(),
});

/* ================= CREATE REQUIREMENT ================= */

export const createRequirementSchema = z.object({
  body: z.object({
    intent: intentSchema,
    constraints: constraintsSchema,
    preferences: preferencesSchema.optional(),
  }),
});

/* ================= UPDATE REQUIREMENT ================= */

export const updateRequirementSchema = z.object({
  params: z.object({
    requirementId: objectIdSchema,
  }),

  body: z
    .object({
      intent: intentSchema.optional(),
      constraints: constraintsSchema.optional(),
      preferences: preferencesSchema.optional(),
      matchedInventoryIds: z.array(objectIdSchema).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required to update",
    }),
});

/* ================= GET REQUIREMENT BY ID ================= */

export const getRequirementByIdSchema = z.object({
  params: z.object({
    requirementId: objectIdSchema,
  }),
});

/* ================= DELETE REQUIREMENT ================= */

export const deleteRequirementSchema = z.object({
  params: z.object({
    requirementId: objectIdSchema,
  }),
});

