
import { z, ZodIssue } from 'zod';
import adminWorker, { getRootUsers } from '../workers/adminWorker';
import { createRoleSchema } from '../types/admin';
import { createAdminDeptSchema } from '../types/dept';

export const adminResolvers = {
  getAllUsers: async () => {
    // try {
    //   return await prisma.member.findMany();
    // } catch (error) {
    //   logger.error('Error fetching users:', error);
    //   throw new Error('Error fetching users');
    // }
  },
  getAllRoles: async () => {
    try {
      return await adminWorker.getRoles();
    } catch (error) {
      throw new Error('Error fetching roles');
    }
  },
  getPlans: async () => {
    return await adminWorker.getPlans();
  },
  getDeptsAdmin: async () => {
    return await adminWorker.getDeptsAdmin();
  },
  getDeptWFields: async () => {
    return await adminWorker.getDeptWFields();
  },
  getRootUsers: async () => {
    try {
      return await getRootUsers();
    } catch (error) {
      throw new Error('Error fetching root users');
    }
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

    return await adminWorker.createRole(parsedData.data);
  },
  createDept: async ({ input }: { input: z.infer<typeof createAdminDeptSchema> }) => {
    return await adminWorker.createDept(input);
  },
  createNUpdateSubscriptionPlan: async ({ input }: { input: any }) => {
    return await adminWorker.createNUpdateSubscriptionPlan(input);
  },
  updateCompanySubscription: async ({ companyId, planId, allowedDeptsIds, startDate, endDate }: { startDate: Date, endDate: Date, companyId: string, planId: string, allowedDeptsIds: string[] }) => {
    return await adminWorker.updateCompanySubscription(companyId, planId, allowedDeptsIds, startDate, endDate);
  },
  getCompanySubscription: async ({ companyId }: { companyId: string }) => {
    return await adminWorker.getCompanySubscription(companyId);
  },
  createBroadcastForm: async ({ input }: { input: any }) => {
    return await adminWorker.createBroadcastForm(input);
  },
  updateBroadcastForm: async ({ input }: { input: any }) => {
    return await adminWorker.updateBroadcastForm(input);
  },
  broadcastForm: async () => {
    return await adminWorker.broadcastForm();
  }
}