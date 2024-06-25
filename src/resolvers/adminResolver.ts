
import { z, ZodIssue } from 'zod';
import adminWorker from '../workers/adminWorker';
import { createRoleSchema } from '../types/admin';

export const adminResolvers = {
  getAllUsers: async () => {
    // try {
    //   return await prisma.member.findMany();
    // } catch (error) {
    //   logger.error('Error fetching users:', error);
    //   throw new Error('Error fetching users');
    // }
  },
  createUserRole: async ({ name }: z.infer<typeof createRoleSchema>) => {
    const parsedData = createRoleSchema.safeParse({ name });

    if (!parsedData.success) {
      const errors = parsedData.error.errors.map((err: ZodIssue) => ({
        message: err.message,
        path: err.path,
      }));
      return { user: null, errors };
    }

    return adminWorker.createRole(parsedData.data);
  },
}