
import { z, ZodIssue } from 'zod';
import userWorker from '../workers/userWorker';
import { CreateOrUpdateManagerSchema, loggedUserSchema } from '../types/user';

export const userResolvers = {

    createOrUpdateManager: async ({ memberId, name, email, password, phone, type, companyId, deptId }: z.infer<typeof CreateOrUpdateManagerSchema>, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        if (user?.role?.name !== 'Root') {
            throw new Error('Unauthorized');
        }
        const parsedData = CreateOrUpdateManagerSchema.safeParse({ memberId, name, email, password, phone, type, companyId, deptId });

        if (!parsedData.success) {
            const errors = parsedData.error.errors.map((err: ZodIssue) => ({
                message: err.message,
                path: err.path,
            }));
            return { user: null, errors };
        }

        return await userWorker.createOrUpdateManager(parsedData.data);
    },
    getCompanyDeptMembers: async ({ companyId, deptId }: { companyId: string, deptId: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        if (user.role.name !== 'Root' && user.role.name !== 'Manager') {
            throw new Error('Unauthorized');
        }
        return await userWorker.getCompanyDeptMembers(companyId, deptId);
    }
}