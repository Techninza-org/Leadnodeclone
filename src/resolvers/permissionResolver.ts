import logger from '../utils/logger';
import { PermissionController } from '../workers/permissionWorker';

const permissionController = new PermissionController();
export const permissionResolvers = {
    getAllPermissions: async () => {
        try {
            return await permissionController.getPermissions();
        } catch (error) {
            logger.error('Error getting all permissions:', error);
            throw new Error(`Error getting all permissions: ${error}`);
        }
    },
    getPermissionsByRoleId: async (_: any, { user }: { user: any }) => {
        try {
            return await permissionController.getPermissionsByRoleId(user.roleId);
        } catch (error) {
            logger.error('Error getting permissions by role ID:', error);
            throw new Error(`Error getting permissions by role ID: ${error}`);
        }
    },
    createPermission: async ({ input }: { input: any }) => {
        try {
            return await permissionController.createPermission(input);
        } catch (error) {
            logger.error('Error creating permission:', error);
            throw new Error(`Error creating permission: ${error}`);
        }
    },
    updatePermission: async ({ id, input }: { id: string, input: any }) => {
        try {
            return await permissionController.updatePermission(id, input);
        } catch (error) {
            logger.error('Error updating permission:', error);
            throw new Error(`Error updating permission: ${error}`);
        }
    },
    deletePermission: async ({ id }: { id: string }) => {
        try {
            await permissionController.deletePermission(id);
            return true;
        } catch (error) {
            logger.error('Error deleting permission:', error);
            throw new Error(`Error deleting permission: ${error}`);
        }
    },
    assignPermissionToRole: async ({ roleId, permissionId }: { roleId: string, permissionId: string }) => {
        try {
            await permissionController.assignPermissionToRole(roleId, permissionId);
            return true;
        } catch (error) {
            logger.error('Error assigning permission to role:', error);
            throw new Error(`Error assigning permission to role: ${error}`);
        }
    },
    removePermissionFromRole: async ({ roleId, permissionId }: { roleId: string, permissionId: string }) => {
        try {
            await permissionController.removePermissionFromRole(roleId, permissionId);
            return true;
        } catch (error) {
            logger.error('Error removing permission from role:', error);
            throw new Error(`Error removing permission from role: ${error}`);
        }
    },
    updateRolePermissions: async ({ input }: { input: any }) => {
        try {
            await permissionController.updateRolePermissions(input);
            return true;
        } catch (error) {
            logger.error('Error updating role permissions:', error);
            throw new Error(`Error updating role permissions: ${error}`);
        }
    }
};
