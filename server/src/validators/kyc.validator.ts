import { z } from "zod";

/* ================= SUBMIT KYC SCHEMA ================= */
export const submitKycSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .nonempty("First name is required")
      .max(50, "First name cannot exceed 50 characters"),

    middleName: z.string().max(50).optional(),

    lastName: z
      .string()
      .nonempty("Last name is required")
      .max(50, "Last name cannot exceed 50 characters"),

    dob: z
      .string()
      .nonempty("DOB is required")
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid DOB format",
      }),

    phone: z
      .string()
      .nonempty("Phone number is required")
      .regex(/^[6-9]\d{9}$/, "Invalid phone number"),

    residentialAddress: z
      .string()
      .nonempty("Residential address is required"),

    city: z
      .string()
      .nonempty("City is required"),

    state: z
      .string()
      .nonempty("State is required"),

    pincode: z
      .string()
      .nonempty("Pincode is required")
      .regex(/^\d{6}$/, "Invalid pincode"),

    country: z.string().optional(),

    aadhaarNo: z
      .string()
      .nonempty("Aadhaar number is required")
      .regex(/^\d{12}$/, "Invalid Aadhaar number"),

    panNo: z
      .string()
      .nonempty("PAN number is required")
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number")
      .transform((val) => val.toUpperCase()),
  }),
});

/* ================= VERIFY KYC SCHEMA ================= */
export const verifyKycSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid KYC ID"),
  }),

  body: z
    .object({
      decision: z.enum(["approved", "rejected"]),
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
