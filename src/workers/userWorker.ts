import logger from '../utils/logger';
import prisma from '../config/database';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { loginSchema, signupSchema, CreateOrUpdateManagerSchema } from '../types/user';
import { verifyOtp } from '../utils/user-worker-utils';

/*
User: [Root, Telecaller, Exchanger, Financer, Manager]
*/

const createUser = async (user: z.infer<typeof signupSchema>) => {
    try {

        let newUser = null;

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

        // Root user can create company and manager, Return !
        if (role.name === "Root") {
            const result = await prisma.$transaction(async (prisma) => {
                const newUser = await prisma.member.create({
                    data: {
                        email: user.email,
                        password: user.password,
                        name: user.name,
                        phone: user.phone,
                        roleId: role.id,
                    },
                });

                const existingDepts = await prisma.adminDept.findMany();
                const deptsArray = existingDepts.map(dept => ({
                    deptField: {
                        connect: { id: dept.id }
                    },
                    deptManagerId: newUser.id,

                }));

                const newCompany = await prisma.company.create({
                    data: {
                        rootId: newUser.id,
                        companyManagerId: newUser.id,
                        name: user.companyName || "",
                        phone: user.companyPhone || "",
                        email: user.companyEmail || "",
                        Depts: {
                            create: deptsArray,
                        },
                    },
                });

                await prisma.member.update({
                    where: { id: newUser.id },
                    data: {
                        Company: {
                            connect: { id: newCompany.id }
                        }
                    }
                });

                return { newUser, newCompany };
            });

            return { user: result.newUser, errors: [] };
        }

        const isCompanyValid = await prisma.company.findFirst({
            where: { id: user.companyId },
        });

        if (!isCompanyValid) {
            return {
                user: null,
                errors: [{
                    message: 'Company not found.',
                    path: [],
                }]
            };
        }

        if (!user.deptId) {
            return {
                user: null,
                errors: [{
                    message: 'deptId is required!',
                }],
            };
        }

        const dept = await prisma.dept.findFirst({
            where: { id: user.deptId },
        })

        if (!dept) {
            return {
                user: null,
                errors: [{
                    message: 'Department not found.',
                }],
            };
        }

        if (role.name === "Manager" && dept.deptManagerId) {
            return {
                user: null,
                errors: [{
                    message: 'Department already have a manager. It can only update!',
                }],
            };
        }

        // TODO: dept manager update API

        newUser = await prisma.member.create({
            data: {
                email: user.email,
                password: user.password,
                name: user.name,
                phone: user.phone,
                Dept: {
                    connect: { id: user.deptId }
                },
                role: {
                    connect: { id: role.id }
                },
                Company: {
                    connect: { id: user.companyId }
                },
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

const createOrUpdateManager = async ({
    memberId,
    name,
    email,
    password,
    phone,
    companyId,
    deptId,
    type
}: z.infer<typeof CreateOrUpdateManagerSchema>) => {
    try {
        // Fetch Manager Role
        const managerRole = await prisma.role.findFirst({
            where: { name: 'Manager' },
        });

        if (!managerRole) {
            return {
                user: null,
                errors: [{ message: 'Manager role not found.' }],
            };
        }

        const result = await prisma.$transaction(async (tx) => {
            let manager = null;

            // Find or create the manager
            manager = await tx.member.findFirst({
                where: {
                    OR: [
                        { id: memberId },
                        { email: email },
                        { phone: phone },
                    ],
                },
            });

            if (!manager) {
                manager = await tx.member.create({
                    data: {
                        email: email || "",
                        password: password || "",
                        name: name || "",
                        phone: phone || "",
                        role: { connect: { id: managerRole.id } }
                    }
                });
            }

            // Find the company
            const company = await tx.company.findFirst({
                where: { id: companyId },
            });

            if (!company) {
                return {
                    user: null,
                    errors: [{ message: 'Company not found.' }],
                };
            }

            let user = null;

            if (type === 'COMPANY' || type === 'BOTH') {
                await tx.company.update({
                    where: { id: companyId },
                    data: {
                        companyManagerId: manager.id,
                        members: { connect: { id: manager.id } },
                    },
                });

                await tx.member.update({
                    where: { id: manager.id },
                    data: {
                        Dept: {
                            disconnect: true
                        }
                    }
                });
            }

            if (type === 'DEPARTMENT' || type === 'BOTH') {
                const dept = await tx.dept.findFirst({
                    where: { id: deptId },
                });

                if (!dept) {
                    return {
                        user: null,
                        errors: [{ message: 'Department not found.' }],
                    };
                }

                // Update department with manager
                await tx.dept.update({
                    where: { id: deptId },
                    data: {
                        deptManagerId: manager.id,
                        Company: { connect: { id: companyId } },
                        members: { connect: { id: manager.id } },
                    },
                });

                // Ensure the manager is connected to the company
                user = await tx.member.update({
                    where: { id: manager.id },
                    data: {
                        Company: { connect: { id: companyId } },
                    },
                });
            }

            return { user: user || manager, errors: [] };
        });

        return {
            user: result.user,
            errors: result.errors
        };
    } catch (error) {
        logger.error('Error updating manager:', error);
        return { user: null, errors: [{ message: 'Error updating manager', path: [] }] };
    }
};


export default {
    // getAllUsers,
    // getUserById,
    createUser,
    // updateUser,
    loginUser,
    createOrUpdateManager
};