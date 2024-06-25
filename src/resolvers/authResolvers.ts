
import { z, ZodIssue } from 'zod';
import userWorker from '../workers/userWorker';
import { signupSchema } from '../types/user';

export const authResolvers = {
  createUser: async ({ name, email, phone, password }: z.infer<typeof signupSchema>) => {
    const parsedData = signupSchema.safeParse({ name, email, phone, password });

    if (!parsedData.success) {
      const errors = parsedData.error.errors.map((err: ZodIssue) => ({
        message: err.message,
        path: err.path,
      }));
      return { user: null, errors };
    }

    return await userWorker.createUser(parsedData.data);
  },
}