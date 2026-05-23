import { z } from 'zod';

export const taskStatusEnum = z.enum(['todo', 'in_progress', 'in_review', 'blocked', 'done']);
export const taskPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const taskTypeEnum = z.enum(['feature', 'bug', 'chore', 'spike', 'epic']);

export const taskCreateSchema = z.object({
  project_id: z.string().min(1, 'Project required'),
  sprint_id: z.string().nullable().optional(),
  title: z.string().min(2, 'Title required').max(200),
  description: z.string().max(2000).default(''),
  type: taskTypeEnum.default('feature'),
  priority: taskPriorityEnum.default('medium'),
  status: taskStatusEnum.default('todo'),
  story_points: z.number().int().min(0).max(100).nullable().optional(),
  assignee_id: z.string().nullable().optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .nullable()
    .optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
