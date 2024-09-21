
import { z, ZodIssue } from 'zod';
import userWorker from '../workers/userWorker';
import { CreateOrUpdateManagerSchema, loggedUserSchema, signupSchema } from '../types/user';

export const userResolvers = {
    updateUser: async ({ updateUserInput }: { updateUserInput: { name?: string, email?: string, phone: string, deptId?: string, roleId?: string } }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        return await userWorker.updateUser(updateUserInput, user);
    },
    createOrUpdateManager: async ({ memberId, name, email, password, phone, memberType, companyId, deptId }: z.infer<typeof CreateOrUpdateManagerSchema>, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        if (user?.role?.name !== 'Root') {
            throw new Error('Unauthorized');
        }
        const parsedData = CreateOrUpdateManagerSchema.safeParse({ memberId, name, email, password, phone, memberType, companyId, deptId });

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
        // if (user.role.name !== 'Root' && user.role.name !== 'Manager') {
        //     throw new Error('Unauthorized');
        // }
        return await userWorker.getCompanyDeptMembers(companyId, deptId);
    },
    savedMemberLocation: async ({ memberId, locations }: { memberId: string, locations: Array<{ apiHitTime: string, latitude: number; longitude: number; idleTime?: string, movingTime: string, batteryPercentage: string, networkStrength: string, isLocationOff: boolean }> }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        // if (user.role.name !== 'Root' && user.role.name !== 'Manager') {
        //     throw new Error('Unauthorized');
        // }
        return await userWorker.savedMemberLocation(memberId, locations);
    },
    getMemberLocation: async ({ memberId, date }: { memberId: string, date: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        // if (user.role.name !== 'Root' && user.role.name !== 'Manager') {
        //     throw new Error('Unauthorized');
        // }
        return await userWorker.getDriverLocationHistory(memberId, date);
    },
    getMembersByRole: async ({ role }: { role: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        if (user.role.name === 'Root') {
            throw new Error('Unauthorized');
        }
        return await userWorker.getUserByRole(role, user.companyId);
    },
    getBroadcasts: async (_: any, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        return await userWorker.getBroadcasts(user.companyId);
    },
    deleteBroadcast: async ({ broadcastId }: { broadcastId: string }) => {
        return await userWorker.deleteBroadcast(broadcastId);
    },
    getBroadcastById: async ({ broadcastId }: { broadcastId: string }) => {
        return await userWorker.getBroadcastById(broadcastId);
    }
}