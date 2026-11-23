import { z } from "zod";

// These mirror src/lib/validation.ts in the interface.
export const passwordSchema = z
  .string({ required_error: "Enter a password" })
  .min(8, "Use at least 8 characters")
  .max(128, "Use at most 128 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const emailSchema = z
  .string({ required_error: "Enter your email address" })
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

export const nameSchema = z
  .string({ required_error: "Enter your full name" })
  .trim()
  .min(2, "Enter your full name")
  .max(80, "Name must be 80 characters or fewer");

const phoneRaw = z
  .string()
  .trim()
  .regex(/^(\+91[\s-]?)?[6-9][0-9]{9}$/, "Enter a valid 10-digit mobile number");

/** Optional Indian mobile. Stored as 10 digits, empty string clears it. */
export const phoneSchema = z.union([z.literal(""), phoneRaw]).transform((v) => (v ? v.replace(/^\+91[\s-]?/, "") : ""));

export const pincodeSchema = z.union([
  z.literal(""),
  z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a 6-digit PIN code"),
]);

export const addressSchema = z
  .object({
    line1: z.string().trim().max(160).optional().default(""),
    city: z.string().trim().max(80).optional().default(""),
    state: z.string().trim().max(80).optional().default(""),
    pincode: pincodeSchema.optional().default(""),
  })
  .default({});

export const schemas = {
  register: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: z.string().optional(),
  }),
  login: z.object({ email: emailSchema, password: z.string().min(1, "Enter your password") }),
  profile: z.object({ name: nameSchema, phone: phoneSchema.optional().default(""), address: addressSchema }),
  changePassword: z.object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
  }),
  contact: z.object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    email: emailSchema,
    message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(2000),
  }),
};
