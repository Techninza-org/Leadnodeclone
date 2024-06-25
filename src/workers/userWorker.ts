import logger from '../utils/logger';
import prisma from '../config/database';
import { z } from 'zod';

import { signupSchema } from '../types/user';

/*
User: [Root, Telecaller, Exchanger, Financer, Manager]
*/

const createUser = async (user: z.infer<typeof signupSchema>) => {
    try {
        const existingUser = await prisma.member.findFirst({
            where: {
                OR: [
                    { email: user.email },
                    { phone: user.phone },
                ],
            },
        });

        if (existingUser) {
            return {
                user: null,
                errors: [{
                    message: 'User with this email or phone already exists.',
                    path: [],
                }],
            };
        }

        const role = await prisma.role.findFirst({
            where: user.roleId ? { id: user.roleId } : { name: "Root" },
        });

        if (!role) {
            return {
                user: null,
                errors: [{
                    message: 'Role not found.',
                    path: [],
                }],
            };
        }


        const newUser = await prisma.member.create({
            data: {
                email: user.email,
                password: "hello", // Ensure to hash the password before saving
                name: user.name,
                phone: user.phone,
                roleId: role.id,
            },
        });

        return { user: newUser, errors: [] };
    } catch (error) {
        logger.error('Error creating user:', error);
        return { user: null, errors: [{ message: 'Error creating user', path: [] }] };
    }
}


export default {
    // getAllUsers,
    // getUserById,
    createUser,
    // updateUser,
    // loginUser
};