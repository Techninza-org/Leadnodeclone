import logger from '../utils/logger';
import prisma from '../config/database';
import { z } from 'zod';
import { createRoleSchema } from '../types/admin';
import { createAdminDeptSchema } from '../types/dept';

export const getCompanyDeptFields = async (deptId: string) => {
    try {
        const deptFields = await prisma.companyDeptForm.findMany({
            where: {
                companyDeptId: deptId
            },
            include: {
                subDeptFields: true
            },
            orderBy: { 
                order: 'desc',
            }
        });
        return deptFields;
    } catch (error: any) {
        logger.log(error.message, 'error')
        throw new Error('Error fetching departments');
    }
}

export const getDepts = async (companyId: string) => {
    try {
        const depts = await prisma.companyDept.findMany({
            where: {
                companyId
            },
            include: {
                companyDeptForms: true
            }
        });
        return depts;
    } catch (error: any) {
        logger.log(error.message, 'error')
        throw new Error('Error fetching departments');
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
        throw new Error('Not implemented');
        // logger.log(dept, 'dept');

        // const newDept = await prisma.adminDept.upsert({
        //     where: { 
        //         name: dept.name,
        //     },
        //     update: {
        //         deptFields: {
        //             create: {
        //                 name: dept.subDeptName,
        //                 SubDeptField:  { 
        //                     create: dept.deptFields.map(field => ({
        //                         name: field.name,
        //                         fieldType: field.fieldType,
        //                         value: field.value,
        //                         options: field.options,
        //                         order: field.order,
        //                         isDisabled: field.isDisabled,
        //                         isRequired: field.isRequired
        //                     }))
        //                 }
        //             }
        //         }
        //     },
        //     create: {
        //         name: dept.name,
        //         deptFields: {
        //             create: {
        //                 name: dept.subDeptName,
        //                 SubDeptField:  { 
        //                     create: dept.deptFields.map(field => ({
        //                         name: field.name,
        //                         fieldType: field.fieldType,
        //                         value: field.value,
        //                         options: field.options,
        //                         order: field.order,
        //                         isDisabled: field.isDisabled,
        //                         isRequired: field.isRequired
        //                     }))
        //                 }
        //             }
        //         }
        //     }
        // });

        // return { dept: newDept, errors: [] };
    } catch (error: any) {
        logger.error('Error creating department:', error);
        throw new Error(`Error creating department: ${error.message}`);
    }
};

const createnUpdateCompanyDept = async (companyId: string, dept: z.infer<typeof createAdminDeptSchema>) => {
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

        const company = await prisma.company.findFirst({
            where: { id: companyId },
        });

        if (!company) {
            throw new Error('Company not found.');
        }

        const newDept = await prisma.companyDept.upsert({
            where: {
                id: dept.id,
            },
            update: {
                companyDeptForms: {
                    create: {
                        name: dept.subDeptName,
                        order: dept.order,
                        subDeptFields: {
                            create: fieldsToCreate
                        }
                    }
                }
            },
            create: {
                name: dept.name,
                deptManagerId: company?.companyManagerId,
                companyId,
                companyDeptForms: {
                    create: {
                        name: dept.subDeptName,
                        order: dept.order,
                        subDeptFields: {
                            create: fieldsToCreate
                        }
                    }
                }
            },
        });

        return { dept: newDept, errors: [] };
    } catch (error: any) {
        logger.error('Error creating department:', error);
        throw new Error(`Error creating department: ${error.message}`);
    }
};


export default {
    getDepts,
    getCompanyDeptFields,
    createnUpdateCompanyDept,
    createRole,
    createDept
}