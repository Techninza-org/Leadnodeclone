import logger from '../utils/logger';
import prisma from '../config/database';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { loginSchema, signupSchema } from '../types/user';
import { verifyOtp } from '../utils/user-worker-utils';

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

        let newUser = null;

        if (role.name === "Root") {
            const result = await prisma.$transaction(async (prisma) => {
                let newUser = await prisma.member.create({
                    data: {
                        email: user.email,
                        password: user.password,
                        name: user.name,
                        phone: user.phone,
                        roleId: role.id,
                    },
                });

                const newCompany = await prisma.company.create({
                    data: {
                        userId: newUser.id,
                        name: user.companyName || "",
                        phone: user.companyPhone || "",
                        email: user.companyEmail || "",
                    },
                });

                newUser = await prisma.member.update({
                    where: { id: newUser.id },
                    data: { companyId: newCompany.id },
                });

                return { newUser, newCompany };
            });

            newUser = result.newUser;
            return { user: newUser, errors: [] };
        }

        newUser = await prisma.member.create({
            data: {
                email: user.email,
                password: "hello", // Ensure to hash the password before saving
                name: user.name,
                phone: user.phone,
                roleId: role.id,
                companyId: user.companyId,
            },
        });

        return { user: newUser, errors: [] };
    } catch (error) {
        logger.error('Error creating user:', error);
        return { user: null, errors: [{ message: 'Error creating user', path: [] }] };
    }
}
const loginUser = async (loginInfo: z.infer<typeof loginSchema>) => {
    try {
        let user = null;

        if (loginInfo.email && loginInfo.password) {
            user = await prisma.member.findFirst({
                where: {
                    email: loginInfo.email,
                    password: loginInfo.password,
                },
            });
        } else if (loginInfo.phone && loginInfo.otp) {

            const isOtpValid = await verifyOtp(loginInfo.phone, loginInfo.otp);
            if (!isOtpValid) {
                return { user: null, errors: [{ message: 'Invalid OTP', path: [] }] };
            }

            user = await prisma.member.findFirst({
                where: {
                    phone: loginInfo.phone,
                },
            });
        } else {
            return { user: null, errors: [{ message: 'Invalid login information', path: [] }] };
        }

        if (!user) {
            return { user: null, errors: [{ message: 'Invalid login credentials', path: [] }] };
        }

        const sessionToken = uuidv4();

        user = await prisma.member.update({
            where: { id: user.id },
            data: { sessionToken },
            include: { role: true },
        });

        return { user: { ...user, sessionToken }, errors: [] };
    } catch (error) {
        logger.error('Error logging in user:', error);
        return { user: null, errors: [{ message: 'Error logging in user', path: [] }] };
    }
};


export default {
    // getAllUsers,
    // getUserById,
    createUser,
    // updateUser,
    loginUser
};