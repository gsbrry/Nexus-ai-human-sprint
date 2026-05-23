import { z } from 'zod';

export const taskTypeEnum = z.enum(['feature', 'bug', 'chore', 'spike', 'epic']);
export const taskPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);

// The schema the Claude prompt instructs the model to produce.
// Matches Mock/Supabase task shape for the writable fields a CSV import sets.
export const importTaskSchema = z.object({
  title: z.string().min(2, 'Title required').max(200),
  description: z.string().max(2000).default(''),
  type: taskTypeEnum.default('feature'),
  priority: taskPriorityEnum.default('medium'),
  story_points: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === 'string' ? Number(v) : v))
    .refine((v) => Number.isFinite(v) && [0, 1, 2, 3, 5, 8, 13, 21].includes(v), 'Must be 1/2/3/5/8/13/21')
    .optional(),
  assignee: z.string().nullable().optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .nullable()
    .optional(),
});

export const importPayloadSchema = z.object({
  tasks: z.array(importTaskSchema).min(1, 'No tasks in payload').max(500, 'Max 500 tasks per import'),
});

export type ImportTask = z.infer<typeof importTaskSchema>;
export type ImportPayload = z.infer<typeof importPayloadSchema>;
