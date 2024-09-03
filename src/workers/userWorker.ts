import logger from '../utils/logger';
import prisma from '../config/database';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { loginSchema, signupSchema, CreateOrUpdateManagerSchema } from '../types/user';
import { generateHash, generateToken, getUserByIdEmailPhone, sendOTP, verifyHash, verifyOtp } from '../utils/user-worker-utils';
import { format } from 'date-fns';
import { getISTTime } from '../utils';

/*
User: [Root, Telecaller, Exchanger, Financer, Manager]
*/
const generateOTP = async (phone: string) => {
    try {
        const user = await prisma.member.findFirst({
            where: {
                phone,
            },
        });

        if (!user) {
            throw new Error('User not found.');
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60000);

        await prisma.member.update({
            where: { id: user.id },
            data: { otp, otpExpiry },
        });

        await sendOTP(1, phone, otp);

        return {
            id: user.id,
            otp,
            otpExpiry,
        };
    }
    catch (error: any) {
        logger.error('Error generating OTP:', error);
        throw new Error(error.message);
    }
}

const createUser = async (user: z.infer<typeof signupSchema>) => {
    try {

        let newUser = null;

        const existingUser = await getUserByIdEmailPhone({ email: user.email, phone: user.phone })

        if (existingUser) {
            throw new Error('User with this email or phone already exists.');
        }

        const role = await prisma.role.findFirst({
            where: user.roleId ? { id: user.roleId } : { name: "Root" },
        });

        if (!role) {
            throw new Error('Role not found.');
        }

        const hashedPassword = await generateHash(user.password);

        // Root user can create company and manager, Return !
        if (role.name === "Root") {
            const result = await prisma.$transaction(async (prisma) => {
                const newUser = await prisma.member.create({
                    data: {
                        email: user.email,
                        password: hashedPassword,
                        name: user.name,
                        phone: user.phone,
                        roleId: role.id,
                    },
                });

                const existingDepts = await prisma.adminDept.findMany({
                    include: {
                        deptFields: {
                            include: {
                                SubDeptField: true
                            }
                        },
                    }
                });
                const deptsArray = existingDepts.map(dept => ({
                    name: dept.name,
                    deptManagerId: newUser.id,
                    companyDeptForms: {
                        create: dept.deptFields.map(field => ({
                            name: field.name,
                            order: field.order,
                            subDeptFields: {
                                create: field.SubDeptField.map(subField => ({
                                    name: subField.name,
                                    order: subField.order,
                                    fieldType: subField.fieldType,
                                    imgLimit: subField.imgLimit,
                                    isDisabled: subField.isDisabled,
                                    isRequired: subField.isRequired,
                                    options: subField.options ? (subField.options as any).map((option: any) => ({
                                        label: option.label,
                                        value: option.value,
                                    })) : [],
                                })),
                            },
                        })),
                    },
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
            throw new Error('Company not found.');
        }

        if (!user.deptId) {
            throw new Error('deptId is required!');
        }

        const dept = await prisma.companyDept.findFirst({
            where: { id: user.deptId },
        })

        if (!dept) {
            throw new Error('Department not found.');
        }

        if (role.name === "Manager" && dept.deptManagerId) {
            throw new Error('Department already have a manager. It can only update!');
        }

        newUser = await prisma.member.create({
            data: {
                email: user.email,
                password: hashedPassword,
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
    } catch (error: any) {
        logger.error('Error creating user:', error);
        throw new Error(error.message);
    }
}

const getUserByRole = async (role: string) => {
    try {
        const users = await prisma.member.findMany({
            where: {
                role: {
                    name: role
                }
            }
        });

        return users;
    } catch (error: any) {
        logger.error('Error fetching users:', error);
        throw new Error(error.message);
    }
}

const loginUser = async (loginInfo: z.infer<typeof loginSchema>) => {
    try {
        let user = null;

        if (loginInfo.email && loginInfo.password) {
            user = await getUserByIdEmailPhone({ email: loginInfo.email });
            if (!user) {
                throw new Error('Invalid email or password');
            }

            const isPasswordValid = await verifyHash(user.password, loginInfo.password);
            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

        } else if (loginInfo.phone && loginInfo.otp) {

            const isOtpValid = await verifyOtp(loginInfo.phone, loginInfo.otp);
            if (!isOtpValid) {
                throw new Error('Invalid OTP');
            }

            user = await prisma.member.findFirst({
                where: {
                    phone: loginInfo.phone,
                },
            });
        } else {
            throw new Error("Invalid login information");
        }

        if (!user) {
            throw new Error("Invalid login credentials");
        }

        const sessionToken = uuidv4();

        user = await prisma.member.update({
            where: { id: user.id },
            data: { sessionToken },
            include: { role: true },
        });

        const token = await generateToken({ id: user.id, sessionToken });

        return { user: { ...user, sessionToken, token }, errors: [] };
    } catch (error: any) {
        logger.error('Error logging in user:', error);
        throw new Error(error.message);
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
    memberType: type
}: z.infer<typeof CreateOrUpdateManagerSchema>) => {
    try {
        // Fetch Manager Role
        const managerRole = await prisma.role.findFirst({
            where: { name: 'Manager' },
        });

        if (!managerRole) {
            throw new Error('Manager role not found.');
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
                throw new Error('Company not found.');
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
                const dept = await tx.companyDept.findFirst({
                    where: { id: deptId },
                });

                if (!dept) {
                    throw new Error('Department not found.');
                }

                // Update department with manager
                await tx.companyDept.update({
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
    } catch (error: any) {
        logger.error('Error updating manager:', error);
        throw new Error(error.message);
    }
};

const getCompanyDeptMembers = async (companyId: string, deptId: string) => {
    try {
        let members;
        if (deptId) {
            members = await prisma.member.findMany({
                where: {
                    companyId: companyId,
                    deptId: deptId,
                },
                include: {
                    role: true,
                    Company: true,
                    Dept: true,
                },
            });
        } else {
            members = await prisma.member.findMany({
                where: {
                    companyId: companyId,
                },
                include: {
                    role: true,
                    Company: true,
                    Dept: true,
                },
            });
        }

        return members;
    } catch (error: any) {
        logger.error('Error fetching company dept members:', error);
        throw new Error(error.message);
    }
}

const savedMemberLocation = async (memberId: string, locations: Array<{ latitude: number; longitude: number; idleTime?: string, movingTime: string }>) => {
    try {
        const today = format(new Date(), 'dd-MM-yyyy');

        const locationData = locations.map(location => ({
            latitude: location.latitude,
            longitude: location.longitude,
            movingTime: location.movingTime,
            idleTime: location?.idleTime,
            timestamp: getISTTime(new Date()),
        }));

        const existingDocument = await prisma.location.findUnique({
            where: {
                leadAssingeeMemberId_day: {
                    leadAssingeeMemberId: memberId,
                    day: today,
                },
            },
        });

        if (existingDocument) {
            return await prisma.location.update({
                where: {
                    id: existingDocument.id,
                },
                data: {
                    locations: {
                        push: locationData,
                    },
                    updatedAt: new Date(),
                },
            });
        } else {
            return await prisma.location.create({
                data: {
                    leadAssingeeMemberId: memberId,
                    day: today,
                    locations: locationData,
                },
            });
        }

    } catch (error: any) {
        logger.error('Error saving member location:', error);
        throw new Error(error?.message);
    }
}

const getDriverLocationHistory = async (memberId: string, date: string) => {
    try {
        const locations = await prisma.location.findFirst({
            where: {
                leadAssingeeMemberId: memberId,
                day: date,
            },
        });
        return locations;
    } catch (error: any) {
        logger.error('Error fetching driver location history:', error);
        throw new Error(error?.message);
    }
}

export default {
    // getAllUsers,
    // getUserById,
    createUser,
    // updateUser,
    generateOTP,
    getUserByRole,
    loginUser,
    createOrUpdateManager,
    getCompanyDeptMembers,
    getDriverLocationHistory,
    savedMemberLocation
};