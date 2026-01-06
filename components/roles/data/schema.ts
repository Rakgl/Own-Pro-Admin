// data/schema.ts
import { z } from 'zod'

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
})

export type Task = z.infer<typeof taskSchema>

export const permissionSchema = z.object({
  id: z.number(),
  name: z.string(),
})

export type Permission = z.infer<typeof permissionSchema>

export const roleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  status: z.string().optional(),
  created_by: z.string().optional(),
  permissions: z.array(permissionSchema).optional(),
  // created_at: z.string().optional(), // If you need to display/use this
})

export type Role = z.infer<typeof roleSchema>
