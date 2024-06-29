import logger from '../utils/logger';
import prisma from '../config/database';
import { z } from 'zod';
import { createRoleSchema } from '../types/admin';
import { createAdminDeptSchema } from '../types/dept';

export const createRole = async (role: z.infer<typeof createRoleSchema>) => {
    const existingRole = await prisma.role.findFirst({
        where: {
            name: role.name,
        },
    });

    if (existingRole) {
        return {
            role: null,
            errors: [{
                message: 'Role with this name already exists.',
                path: ['name']
            }],
        };
    }

    try {
        const newRole = await prisma.role.create({
            data: {
                name: role.name,
            },
        });

        return { role: newRole, errors: [] };
    } catch (error) {
        logger.error('Error creating role:', error);
        return { role: null, errors: [{ message: 'Error creating role', path: [] }] };
    }
}

export const createDept = async (dept: z.infer<typeof createAdminDeptSchema>) => {
    const existingDept = await prisma.adminDept.findFirst({
        where: {
            name: dept.name,
        },
    });

    if (existingDept) {
        return {
            dept: null,
            errors: [{
                message: 'Department with this name already exists.',
            }],
        };
    }

    try {
        const newDept = await prisma.adminDept.create({
            data: {
                name: dept.name,
                deptFields: {
                    create: dept.deptFields
                }

            },
        });

        return { dept: newDept, errors: [] };
    } catch (error) {
        logger.error('Error creating department:', error);
        return { dept: null, errors: [{ message: 'Error creating department', path: [] }] };
    }
}


export default {
    createRole,
    createDept
}