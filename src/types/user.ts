import { z } from 'zod';

export const signupSchema = z.object({
    name: z.string().min(3, 'Please enter your name.'),
    email: z.string().min(3, 'Please enter your email.').email('The email address is badly formatted.'),
    password: z.string().min(3, 'Please enter your password.').min(8, 'Your password must have 8 characters or more.'),
    phone: z.string().length(10, 'Please enter a valid phone number.'),
    roleId: z.string().optional(),
    companyId: z.string().optional(),
    companyName: z.string().optional(),
    companyAddress: z.string().optional(),
    companyPhone: z.string().optional(),
    companyEmail: z.string().optional(),

}).refine(data => {
    if ((!data.roleId || !data.companyId) && (!data.companyName || !data.companyAddress || !data.companyPhone || !data.companyEmail)) {
        return false;
    }

    return true;
}, {
    message: 'Please provide either companyId, or roleId, companyName, companyAddress, companyPhone, companyEmail.',
    path: [
        "companyId",
        "roleId",
        "companyName",
        "companyAddress",
        "companyPhone",
        "companyEmail",
    ],
});

export const loginSchema = z.object({
    email: z.string().email('The email address is badly formatted.').optional(),
    password: z.string().min(3, 'Please enter your password.').optional(),
    phone: z.string().length(10, 'Please enter a valid phone number.').optional(),
    otp: z.string().length(6, 'Please enter a valid OTP.').optional(),
}).refine(data => {
    if ((data.email && data.password) || data.phone) {
        return true;
    }
    return false;
}, {
    message: 'Please provide either email and password, or phone number.',
    path: ['email', 'password', 'phone'],
});