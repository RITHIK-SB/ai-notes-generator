import { z } from 'zod';
export const noteSettingsSchema = z.object({
    length: z.enum(['short', 'medium', 'detailed']),
    style: z.enum(['bullet_points', 'headings', 'qa', 'exam_revision']),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    instructions: z.string().max(1000).optional().default(''),
});
export const generateRequestSchema = z.object({
    text: z.string().min(1).max(1_000_000),
    settings: noteSettingsSchema,
});
