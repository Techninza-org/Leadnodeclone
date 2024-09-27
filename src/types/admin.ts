import { z } from 'zod';

export const createRoleSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long."),
});

interface SubCategory {
    name: string;
    order: number;
    options: { label: string, value: string }[];
}

export interface Category {
    name: string;
    order: number;
    subCategory: SubCategory[];
}
