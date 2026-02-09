import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ message: "Name is required" })
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),

    email: z
      .string({ message: "Email is required" })
      .email("Please enter a valid email address"),

    password: z
      .string({ message: "Password is required" })
      .min(6, "Password must be at least 6 characters long"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email format"),

    password: z
      .string({ message: "Password is required" }),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email format"),

    otp: z
      .string({ message: "OTP is required" })
      .length(6, "OTP must be exactly 6 digits"),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email format"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email format"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email format"),

    otp: z
      .string({ message: "OTP is required" })
      .length(6, "OTP must be exactly 6 digits"),

    newPassword: z
      .string({ message: "New password is required" })
      .min(6, "New password must be at least 6 characters long"),
  }),
});
