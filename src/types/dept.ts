import { z } from "zod";

export const createAdminDeptSchema = z.object({
    name: z.string().min(3, "Department Name must be at least 3 characters long").max(30),
    subDeptName: z.string().min(3, "Sub Department Name must be at least 3 characters long").max(30),
    deptFields: z.array(z.object({
        name: z.string().min(3, "Field Name must be at least 3 characters long").max(30),
        fieldType: z.enum(["INPUT", "SELECT", "RADIO", "CHECKBOX", "IMAGE"]),
        value: z.string().optional(),
    })),
});