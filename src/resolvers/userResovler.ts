
import { z, ZodIssue } from 'zod';
import userWorker from '../workers/userWorker';
import { CreateOrUpdateManagerSchema } from '../types/user';

export const userResolvers = {

    createOrUpdateManager: async ({ memberId, name, email, password, phone, type, companyId, deptId }: z.infer<typeof CreateOrUpdateManagerSchema>) => {
        const parsedData = CreateOrUpdateManagerSchema.safeParse({ memberId, name, email, password, phone, type, companyId, deptId });

        if (!parsedData.success) {
            const errors = parsedData.error.errors.map((err: ZodIssue) => ({
                message: err.message,
                path: err.path,
            }));
            return { user: null, errors };
        }

        return await userWorker.createOrUpdateManager(parsedData.data);
    }
}