import { z } from "zod";

export const submitKycSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, "First name is required").max(50),

    middleName: z.string().max(50).optional(),

    lastName: z.string().min(1, "Last name is required").max(50),

    dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid DOB format",
    }),

    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),

    residentialAddress: z.string().min(1, "Residential address is required"),

    city: z.string().min(1, "City is required"),

    state: z.string().min(1, "State is required"),

    pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),

    country: z.string().optional(),

    aadhaarNo: z.string().regex(/^\d{12}$/, "Invalid Aadhaar number"),

    panNo: z
      .string()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number")
      .transform((val) => val.toUpperCase()),
  }),
});

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

export const getKycsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  }),
});
