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

export const getDepts = async () => {
    try {
        const depts = await prisma.adminDept.findMany();
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
            update: {
                deptFields: {
                    create: {
                        name: dept.subDeptName,
                        order: dept.order,
                        SubDeptField: {
                            create: fieldsToCreate
                        }
                    }
                }
            },
            create: {
                name: dept.name,
                deptFields: {
                    create: {
                        name: dept.subDeptName,
                        order: dept.order,
                        SubDeptField: {
                            create: fieldsToCreate
                        }
                    }
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

        return { dept: newDept, errors: [] };
    } catch (error: any) {
        logger.log(error);
        logger.error('Error creating department:', error);
        throw new Error(`Error creating department: ${error.message}`);
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


export default {
    getDepts,
    getRoles,
    getDeptWFields,
    createRole,
    createDept,
    updateDept
}