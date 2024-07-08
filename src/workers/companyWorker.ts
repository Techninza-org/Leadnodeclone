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
            }
        });
        return deptFields;
    } catch (error: any) {
        console.log(error.message, 'error')
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
        console.log(error.message, 'error')
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

export const createDept = async (dept: z.infer<typeof createAdminDeptSchema>) => {
    // const existingDept = await prisma.adminDept.findFirst({
    //     where: {
    //         name: dept.name,
    //     },
    // });

    // if (existingDept) {
    //     throw new Error('Department with this name already exists.');
    // }

    // try {
    //     const newDept = await prisma.adminDept.create({
    //         data: {
    //             name: dept.name,
    //             deptFields: {
    //                 create: {
    //                     name: dept.subDeptName,
    //                     SubDeptField:  { 
    //                         create: dept.deptFields
    //                     }
    //                 }
    //             }
    //         },
    //     });

    //     return { dept: newDept, errors: [] };
    // } catch (error: any) {
    //     logger.error('Error creating department:', error);
    //     throw new Error(`Error creating department: ${error.message}`);
    // }
}


export default {
    getDepts,
    getCompanyDeptFields,
    createRole,
    createDept
}