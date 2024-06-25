import { z } from 'zod';

export const signupSchema = z.object({
    name: z.string().nonempty('Please enter your name.'),
    email: z.string().nonempty('Please enter your email.').email('The email address is badly formatted.'),
    password: z.string().nonempty('Please enter your password.').min(8, 'Your password must have 8 characters or more.'),
    phone: z.string().length(10, 'Please enter a valid phone number.'),
    roleId: z.string().optional(),
});
