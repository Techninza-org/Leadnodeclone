import { z } from 'zod';

export const signupSchema = z.object({
    name: z.string().min(3, 'Please enter your name.'),
    email: z.string().min(3, 'Please enter your email.').email('The email address is badly formatted.'),
    password: z.string().min(3, 'Please enter your password.').min(8, 'Your password must have 8 characters or more.'),
    phone: z.string().length(10, 'Please enter a valid phone number.'),
    roleId: z.string().optional(),
    deptId: z.string().optional(),

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
    platform: z.string().optional(),

}).refine(data => {
    if ((data.email && data.password) || data.phone) {
        return true;
    }

    return false;
}, {
    message: 'Please provide either email and password, or phone number.',
    path: ['email', 'password', 'phone'],
});

export const CreateOrUpdateManagerSchema = z.object({
    companyId: z.string().min(3, 'Please enter your companyId.'),

    memberId: z.string().min(3, 'Please enter your memberId.').optional(),
    name: z.string().min(3, 'Please enter your name.').optional(),
    email: z.string().min(3, 'Please enter your email.').email('The email address is badly formatted.').optional(),
    password: z.string().min(3, 'Please enter your password.').min(8, 'Your password must have 8 characters or more.').optional(),
    phone: z.string().length(10, 'Please enter a valid phone number.').optional(),

    deptId: z.string().min(3, 'Please enter your deptId.').optional(),
    memberType: z.enum(['COMPANY', 'DEPARTMENT', 'BOTH']),

}).refine(data => {
    if ((data.companyId || data.deptId) && data.memberType === 'BOTH') {
        return true;
    }

    if (data.companyId && data.memberType === 'COMPANY') {
        return true;
    }

    if (data.deptId && data.memberType === 'DEPARTMENT') {
        return true;
    }
    if (!data.memberId && (!data.name || !data.email || !data.password || !data.phone)) {

        return {
            message: 'Please provide either memberId, or name, email, password, phone.',
        };
    }

    return false;
}, {
    message: 'Please provide either companyId, or deptId, or both companyId and deptId.',
    path: ['companyId', 'deptId', 'type'],
});

export const loggedUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    sessionToken: z.string(),
    platform: z.string().optional(),
    token: z.string(),
    phone: z.string(),
    role: z.object({
        id: z.string(),
        name: z.string(),
    }),
    deptId: z.string(),
    companyId: z.string(),
})