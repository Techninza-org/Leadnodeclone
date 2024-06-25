import logger from '../utils/logger';
import prisma from '../config/database';
import { z } from 'zod';
import { createRoleSchema } from '../types/admin';

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


export default {
    createRole
}