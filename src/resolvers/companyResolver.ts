
import { z, ZodIssue } from 'zod';
import companyWorker from '../workers/companyWorker';
import { createRoleSchema } from '../types/admin';
import { createAdminDeptSchema } from '../types/dept';

export const companyResolvers = {
  getAllCompanyMembers: async () => {
    // try {
    //   return await prisma.member.findMany();
    // } catch (error) {
    //   logger.error('Error fetching users:', error);
    //   throw new Error('Error fetching users');
    // }
  },
  getMemberRoles: async ({ memberId }: { memberId: string }) => {
    // try {
    //   return await prisma.memberRole.findMany({
    //     where: {
    //       memberId,
    //     },
    //   });
    // } catch (error) {
    //   logger.error('Error fetching user roles:', error);
    //   throw new Error('Error fetching user roles');
    // }
  },
  getCompanyDepts: async ({ companyId }: { companyId: string }) => {
    return await companyWorker.getDepts(companyId);
  },
  getCompanyDeptFields: async ({ deptId }: { deptId: string }) => {
    return await companyWorker.getCompanyDeptFields(deptId);
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

    return await companyWorker.createRole(parsedData.data);
  },
  createCompanyDept: async ({ input }: { input: z.infer<typeof createAdminDeptSchema> }) => {
    const parsedData = createAdminDeptSchema.safeParse(input);


    if (!parsedData.success) {
      const errors = parsedData.error.errors.map((err: ZodIssue) => ({
        message: err.message,
        path: err.path,
      }));
      console.log(errors, 'parsedData')
      return { user: null, errors };
    }

    return await companyWorker.createDept(parsedData.data);
  },
}