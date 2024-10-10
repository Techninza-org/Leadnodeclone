import { z } from "zod";

export const createAdminDeptSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, "Department Name must be at least 3 characters long").max(30),
    subDeptName: z.string().min(3, "Sub Department Name must be at least 3 characters long").max(30),
    order: z.number().int().positive(),
    deptFields: z.array(z.object({
        name: z.string().min(3, "Field Name must be at least 3 characters long").max(30),
        fieldType: z.enum(["INPUT", "SELECT", "RADIO", "CHECKBOX", "IMAGE", "TEXTAREA", "DATE"]),
        value: z.string().optional(),
        order: z.number().int().positive(),
        imgLimit: z.number().int().positive().optional(),
        isDisabled: z.boolean().optional(),
        isRequired: z.boolean().optional(),
        ddOptionId: z.string().optional(),
        options: z.array(z.object({
            label: z.string().min(2, "Option Label must be at least 3 characters long").max(30),
            value: z.string().min(2, "Option Value must be at least 3 characters long").max(30),
        })).optional().default([]),
    })),
});