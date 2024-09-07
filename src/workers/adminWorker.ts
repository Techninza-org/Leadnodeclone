import logger from '../utils/logger';
import prisma from '../config/database';
import { z } from 'zod';
import { createRoleSchema } from '../types/admin';
import { createAdminDeptSchema } from '../types/dept';

export const getDeptWFields = async () => {
    const dept = await prisma.adminDept.findMany({
        include: {
            deptFields: {
                include: {
                    SubDeptField: true
                }
            },
        },
    });

    if (!dept) {
        throw new Error('Department not found.');
    }
    return dept;
}

export const getRootUsers = async () => {
    try {
        const rootUsers = await prisma.member.findMany({
            where: {
                role: {
                    name: 'Root',
                },
            },
            select: {
                companyId: true,
                deptId: true,
                role: true,
                Company: true
            }
        });
        return rootUsers;
    } catch (error: any) {
        throw new Error('Error fetching root users');
    }
}

export const getRoles = async () => {
    try {
        const roles = await prisma.role.findMany();
        return roles;
    } catch (error: any) {
        throw new Error('Error fetching roles');
    }
}

export const getDeptsAdmin = async () => {
    try {
        const depts = await prisma.adminDept.findMany({
            include: {
                deptFields: {
                    include: {
                        SubDeptField: true
                    }
                }
            }
        });
        return depts;
    } catch (error: any) {
        throw new Error(`Error fetching departments: ${error.message}`);
    }
}

export const createRole = async (role: z.infer<typeof createRoleSchema>) => {
    const existingRole = await prisma.role.findFirst({
        where: {
            name: role.name,
        },
    });

    if (existingRole) {
        throw new Error('Role with this name already exists.');
    }

    try {
        const newRole = await prisma.role.create({
            data: {
                name: role.name,
            },
        });

        return { role: newRole, errors: [] };
    } catch (error: any) {
        logger.error('Error creating role:', error);
        throw new Error(`Error creating role: ${error.message}`);
    }
}

const createDept = async (dept: z.infer<typeof createAdminDeptSchema>) => {

    try {
        const fieldsToCreate = dept.deptFields.map(field => ({
            name: field.name,
            fieldType: field.fieldType,
            value: field.value,
            imgLimit: field.imgLimit,
            options: field.options,
            order: field.order,
            isDisabled: field.isDisabled,
            isRequired: field.isRequired
        }));

        const newDept = await prisma.adminDept.upsert({
            where: {
                name: dept.name,
            },
            update: {},
            create: {
                name: dept.name,
            },
            include: {
                deptFields: true, 
            }
        });


        const existingDeptField = await prisma.deptField.findFirst({
            where: {
                name: dept.subDeptName,
                adminDeptId: newDept.id 
            }
        });


        if (existingDeptField) {
            await prisma.subDeptField.deleteMany({
                where: {
                    deptFieldId: existingDeptField.id 
                }
            });

            const updatedSubDept = await prisma.deptField.update({
                where: {
                    id: existingDeptField.id,
                },
                data: {
                    SubDeptField: {
                        create: fieldsToCreate 
                    }
                }
            });
        } else {
            const createdSubDept = await prisma.deptField.create({
                data: {
                    name: dept.subDeptName,
                    order: dept.order,
                    adminDeptId: newDept.id,
                    SubDeptField: {
                        create: fieldsToCreate
                    }
                }
            });
        }

        return { dept: newDept, errors: [] };
    } catch (error: any) {
        console.error('Error creating or updating department:', error);
        throw new Error(`Error creating or updating department: ${error.message}`);
    }
};




const updateDept = async (deptId: string, deptUpdateInput: z.infer<typeof createAdminDeptSchema>) => {
    try {
        // Prepare fields for update
        const fieldsToUpdateOrCreate = deptUpdateInput.deptFields.map(field => ({
            where: { name: field.name },
            update: {
                fieldType: field.fieldType,
                order: field.order,
                isDisabled: field.isDisabled,
                isRequired: field.isRequired
            },
            create: {
                name: field.name,
                fieldType: field.fieldType,
                order: field.order,
                isDisabled: field.isDisabled,
                isRequired: field.isRequired,
                SubDeptField: {
                    // @ts-ignore
                    create: field.SubDeptField?.map(subField => ({
                        name: subField.name,
                        fieldType: subField.fieldType,
                        order: subField.order,
                        isDisabled: subField.isDisabled,
                        isRequired: subField.isRequired
                    })) || []
                }
            }
        }));

        const updatedDept = await prisma.adminDept.update({
            where: {
                id: deptId,
            },
            data: {
                name: deptUpdateInput.name,
                deptFields: {
                    // @ts-ignore
                    upsert: fieldsToUpdateOrCreate
                }
            },
            include: {
                deptFields: {
                    include: {
                        SubDeptField: true
                    }
                }
            }
        });

        console.log('updatedDept:', updatedDept);

        return updatedDept;
    } catch (error: any) {
        console.error('Error updating department:', error);
        throw new Error(`Error updating department: ${error.message}`);
    }
};

const createNUpdateSubscriptionPlan = async (plan: any) => {
    try {
        const newPlan = await prisma.plan.upsert({
            where: {
                id: plan.id,
            },
            update: {
                name: plan.name,
                price: plan.price,
                description: plan.description,
                duration: plan.duration,
                maxUsers: plan.maxUsers,
                allowedDepts: {
                    set: plan.allowedDepts
                }
            },
            create: {
                name: plan.name,
                price: plan.price,
                description: plan.description,
                duration: plan.duration,
                maxUsers: plan.maxUsers,
                allowedDepts: {
                    set: plan.allowedDepts
                }
            },
        });

        return newPlan;
    } catch (error: any) {
        throw new Error(`Error creating subscription plan: ${error.message}`);
    }
}


export default {
    getDeptsAdmin,
    getRoles,
    getDeptWFields,
    getRootUsers,
    createRole,
    createDept,
    updateDept,
    createNUpdateSubscriptionPlan
}