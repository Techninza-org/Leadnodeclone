
import { z, ZodIssue } from 'zod';
import companyWorker from '../workers/companyWorker';
import { createRoleSchema } from '../types/admin';
import { loggedUserSchema } from '../types/user';

export const companyResolvers = {
  getCompanyXchangerBids: async (_: any, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    return await companyWorker.getCompanyXchangerBids(user.companyId);
  },
  getFollowUps: async (_: any, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    return await companyWorker.getFollowUps(user.companyId);
  },
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
  getCompanyDepts: async ({ companyId }: { companyId: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    return await companyWorker.getDepts(user.companyId);
  },
  getCompanyDeptFields: async ({ deptId }: { deptId: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    return await companyWorker.getCompanyDeptFields(deptId, user);
  },
  getCompanyDeptOptFields: async (_: any, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    return await companyWorker.getCompanyDeptOptFields(user.companyId);
  },
  createUserRole: async ({ name }: z.infer<typeof createRoleSchema>, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    const parsedData = createRoleSchema.safeParse({ name });

    if (!parsedData.success) {
      const errors = parsedData.error.errors.map((err: ZodIssue) => ({
        message: err.message,
        path: err.path,
      }));
      return { user: null, errors };
    }

    return await companyWorker.createRole(parsedData.data.name, user.companyId);
  },
  createNUpdateCompanyDeptForm: async ({ input }: { input: any }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    // const parsedData = createAdminDeptSchema.safeParse(input);
    // if (!parsedData.success) {
    //   const errors = parsedData.error.errors.map((err: ZodIssue) => ({
    //     message: err.message,
    //     path: err.path,
    //   }));
    //   return { user: null, errors };
    // }
    return await companyWorker.createNUpdateCompanyDeptForm(input, user);
  },
  createNUpdateCompanyDeptOptForm: async ({ input }: { input: any }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    return await companyWorker.createNUpdateCompanyDeptOptForm(input, user);
  },
  upsertCompanyDeptForm: async ({ formIds, roleId }: { formIds: string[], roleId: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    // console.log(formIds, roleId, "input")
    return await companyWorker.upsertCompanyDeptForm(formIds, roleId, user);
  },
  createDeptCompany: async ({ deptName, deptManagerId }: { deptName: string, deptManagerId: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    return await companyWorker.createDeptCompany(deptName, deptManagerId, user.companyId);
  },
  createCompanyRole: async ({ roleName }: { roleName: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    return await companyWorker.createRole(roleName, user.companyId);
  },
}