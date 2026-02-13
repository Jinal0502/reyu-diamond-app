import { z } from "zod";

/* ================= HELPER FOR REQUIRED STRING ================= */
const requiredString = (fieldName: string, maxLen: number = 50) =>
  z.preprocess(
    (val) => (val === undefined || val === null ? "" : val),
    z
      .string()
      .min(1, `${fieldName} is required`)
      .max(maxLen, `${fieldName} cannot exceed ${maxLen} characters`)
  );

/* ================= SUBMIT KYC SCHEMA ================= */
export const submitKycSchema = z.object({
  body: z.object({
    firstName: requiredString("First name", 50),

    middleName: z.string().max(50, "Middle name cannot exceed 50 characters").optional(),

    lastName: requiredString("Last name", 50),

    dob: z.preprocess(
      (val) => (val === undefined || val === null ? "" : val),
      z
        .string()
        .min(1, "DOB is required")
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid DOB format (use YYYY-MM-DD)",
        })
    ),

    phone: z.preprocess(
      (val) => (val === undefined || val === null ? "" : val),
      z
        .string()
        .min(1, "Phone number is required")
        .regex(/^[6-9]\d{9}$/, "Invalid phone number")
    ),

    residentialAddress: requiredString("Residential address", 200),

    city: requiredString("City", 50),

    state: requiredString("State", 50),

    pincode: z.preprocess(
      (val) => (val === undefined || val === null ? "" : val),
      z
        .string()
        .min(1, "Pincode is required")
        .regex(/^\d{6}$/, "Invalid pincode")
    ),

    country: z.string().optional(),

    aadhaarNo: z.preprocess(
      (val) => (val === undefined || val === null ? "" : val),
      z
        .string()
        .min(1, "Aadhaar number is required")
        .regex(/^\d{12}$/, "Invalid Aadhaar number")
    ),

    panNo: z.preprocess(
      (val) => (val === undefined || val === null ? "" : val),
      z
        .string()
        .min(1, "PAN number is required")
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number")
        .transform((val) => val.toUpperCase())
    ),
  }),
});

/* ================= VERIFY KYC SCHEMA ================= */
export const verifyKycSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid KYC ID"),
  }),

  body: z
    .object({
      decision: z.enum(["approved", "rejected"], {
        error: "Decision is required",
      }),

      reason: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.decision === "rejected") {
          return !!data.reason && data.reason.trim().length > 0;
        }
        return true;
      },
      {
        message: "Rejection reason is required",
        path: ["reason"],
      }
    ),
});

/* ================= GET KYCS SCHEMA ================= */
export const getKycsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  }),
});
