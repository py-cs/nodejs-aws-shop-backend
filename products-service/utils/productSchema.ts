import { z } from "zod";

export const productSchema = z.object({
  title: z.string(),
  description: z.string().optional().default(""),
  price: z.number().positive().finite(),
  stock: z.number().positive().int().finite(),
});
