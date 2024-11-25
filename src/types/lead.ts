import { z } from 'zod';

export const createLeadSchema = z.object({
    id: z.string().optional(),
    companyId: z.string().min(3, "Company ID must be at least 3 characters long."),

    name: z.string().min(3, "Name must be at least 3 characters long."),
    email: z.string().email("Invalid email address."),
    phone: z.string().min(10, "Phone number must be at least 10 characters long."),
    alternatePhone: z.string().optional(),
    address: z.string().min(10, "Address must be at least 10 characters long."),
    city: z.string().min(3, "City must be at least 3 characters long."),
    state: z.string().min(3, "State must be at least 3 characters long."),
    zip: z.string().min(6, "Zip code must be at least 6 characters long."),
    rating: z.number().int().optional(),

    vehicleDate: z.string().optional(),
    vehicleName: z.string().optional(),
    vehicleModel: z.string().optional(),
    nextFollowUpDate: z.string().optional(),
    department: z.string().optional(),
    dynamicFieldValues: z.string().optional(),
});

export const leadAssignToSchema = z.object({
    companyId: z.string().min(3, "Company ID must be at least 3 characters long."),
    leadIds: z.array(z.string().min(3, "Lead ID must be at least 3 characters long.")),
    userIds: z.array(z.string().min(3, "User ID must be at least 3 characters long.")),
    deptId: z.string().min(3, "Department ID must be at least 3 characters long."),
    description: z.string().optional(),
    // assignedOn: z.date().default(() => new Date()),
});



export const submitFeedbackSchema = z.object({
    leadId: z.string().min(3, "Lead ID must be at least 3 characters long."),
    formName: z.string().min(3, "formName must be at least 3 characters long."),
    deptId: z.string().min(3, "Department ID must be at least 3 characters long."),
    callStatus: z.enum(['BUSY', 'PENDING', 'SUCCESS']),
    submitType: z.enum(['submitToManager', 'updateLead']),
    paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED']),
    feedback: z.array(z.object({
        name: z.string().min(3, "Name must be at least 3 characters long."),
        value: z.string().min(2, "Value must be at least 2 characters long."),
        fieldType: z.string().min(3, "Field type must be at least 3 characters long."),
    })),
    urls: z.array(z.string()).optional(),
    nextFollowUpDate: z.string().optional(),
});


export const leadBidSchema = z.object({
    companyId: z.string().min(3, "Company ID must be at least 3 characters long."),
    deptId: z.string().min(3, "Department ID must be at least 3 characters long."),
    memberId: z.string().min(3, "User ID must be at least 3 characters long."),
    leadId: z.string().min(3, "Lead ID must be at least 3 characters long."),
    bidAmount: z.string().min(1, "Bid amount must be greater than 0."),
    description: z.string().optional(),
});