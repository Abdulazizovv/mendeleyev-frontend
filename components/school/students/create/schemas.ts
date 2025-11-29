import * as z from "zod";

export const phoneSchema = z.object({
  phone_number: z.string().regex(/^\+998\d{9}$/, "Telefon raqami noto'g'ri formatda"),
});

export const personalInfoSchema = z.object({
  first_name: z.string().min(1, "Ism kiritilishi shart"),
  last_name: z.string().optional(),
  middle_name: z.string().optional(),
  gender: z.enum(["male", "female", "other", "unspecified"]),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email("Email noto'g'ri formatda").optional().or(z.literal("")),
  password: z.string().min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak").optional().or(z.literal("")),
});

export const relativeSchema = z.object({
  relationship_type: z.enum([
    "father", "mother", "brother", "sister", "grandfather", "grandmother", "uncle", "aunt", "guardian", "other",
  ]),
  first_name: z.string().min(1, "Ism kiritilishi shart"),
  last_name: z.string().optional(),
  middle_name: z.string().optional(),
  phone_number: z.string().regex(/^\+998\d{9}$/, "Noto'g'ri raqam").optional().or(z.literal("")),
  is_primary_contact: z.boolean(),
  is_guardian: z.boolean(),
});

export const academicSchema = z.object({
  class_id: z.string().optional(),
  status: z.enum(["active", "archived", "suspended", "graduated", "transferred"]),
});

export const studentSchema = phoneSchema.merge(personalInfoSchema).merge(academicSchema).extend({
  relatives: z.array(relativeSchema).optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;
export type RelativeFormData = z.infer<typeof relativeSchema>;
