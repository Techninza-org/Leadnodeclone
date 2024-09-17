
import { z, ZodIssue } from 'zod';
import userWorker from '../workers/userWorker';
import { loggedUserSchema, loginSchema, signupSchema } from '../types/user';

export const authResolvers = {
  generateOTP: async ({ phone }: { phone: string }) => {
    return await userWorker.generateOTP(phone);
  },
  getPlatform: async (_: any, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    return await userWorker.getPlatform(user);
  },
  createUser: async ({
    name,
    email,
    phone,
    password,
    roleId,
    deptId,
    companyId,
    companyName,
    companyAddress,
    companyPhone,
    companyEmail,
  }: z.infer<typeof signupSchema>) => {

    const parsedData = signupSchema.safeParse({
      name, email, phone, password, roleId, deptId, companyId, companyName, companyAddress, companyPhone, companyEmail,
    });

    if (!parsedData.success) {
      const errors = parsedData.error.errors.map((err: ZodIssue) => ({
        message: err.message,
        path: err.path,
      }));
      return { user: null, errors };
    }

    return await userWorker.createUser(parsedData.data);

  },
  loginUser: async ({ email, password, phone, otp, platform }: z.infer<typeof loginSchema>) => {
    const parsedData = loginSchema.safeParse({ email, password, phone, otp, platform });

    if (!parsedData.success) {
      const errors = parsedData.error.errors.map((err: ZodIssue) => ({
        message: err.message,
        path: err.path,
      }));
      return { user: null, errors };
    }

    return await userWorker.loginUser(parsedData.data);
  }
}