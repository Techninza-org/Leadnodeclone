import { z } from 'zod';

export const createRoleSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long."),
});