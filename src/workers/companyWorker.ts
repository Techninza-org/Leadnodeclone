import logger from '../utils/logger';
import prisma from '../config/database';
import { z } from 'zod';
import { createRoleSchema } from '../types/admin';
import { createAdminDeptSchema } from '../types/dept';
import { loggedUserSchema } from '../types/user';

const getCompanyDeptFields = async (deptId: string, ctxUser: z.infer<typeof loggedUserSchema>) => {
    try {

        // For Root Only
        // if (ctxUser.role.name === "Root") {
        const deptFieldsRoot = await prisma.companyDeptForm.findMany({
            where: {
                companyDept: {
                    companyId: ctxUser.companyId
                }
            },
            include: {
                fields: true,
                category: true
            },
            orderBy: {
                order: 'desc',
            }
        });

        return deptFieldsRoot;
        // }


        // For EMP only
        // const deptFields = await prisma.companyDeptForm.findMany({
        //     where: {
        //         companyDeptId: deptId
        //     },
        //     include: {
        //         subDeptFields: true
        //     },
        //     orderBy: {
        //         order: 'desc',
        //     }
        // });
        // return deptFields;
    } catch (error: any) {
        logger.log(error.message, 'error')
        throw new Error('Error fetching departments');
    }
}

const getCompanyDeptOptFields = async (companyId: string) => {
    // try {
    //     const deptFields = await prisma.companyDeptOptForm.findMany({
    //         where: {
    //             companyId: companyId
    //         },
    //         include: {
    //             subDeptFields: true
    //         },
    //         orderBy: {
    //             order: 'desc',
    //         }
    //     });
    //     return deptFields;
    // } catch (error: any) {
    //     logger.log(error.message, 'error')
    //     throw new Error('Error fetching departments');
    // }
}

const getFollowUps = async (companyId: string) => {
    try {
        const followUps = await prisma.leadFollowUp.findMany({
            where: {
                lead: {
                    companyId
                }
            },
        });
        return followUps;
    } catch (error: any) {
        logger.log(error.message, 'error')
        throw new Error('Error fetching departments');
    }
}

const getCompanyXchangerBids = async (companyId: string) => {
    try {
        const bids = await prisma.bid.findMany({
            where: {
                lead: {
                    companyId
                }
            },
            include: {
                member: true,
                lead: true
            }
        });
        return bids;
    }
    catch (error: any) {
        logger.log(error.message, 'error')
        throw new Error('Error fetching departments');
    }
}

const getDepts = async (companyId: string) => {
    try {
        const depts = await prisma.companyDept.findMany({
            where: {
                companyId
            },
            include: {
                companyForms: {
                    include: {
                        fields: true,
                        category: true
                    }
                }
            }
        });

        return depts;
    } catch (error: any) {
        logger.log(error.message, 'error')
        throw new Error('Error fetching departments');
    }
}

const createRole = async (roleName: string, companyId: string) => {
    const existingRole = await prisma.role.findFirst({
        where: {
            name: roleName,
        },
    });

    if (existingRole) {
        throw new Error('Role with this name already exists.');
    }

    try {
        const newRole = await prisma.role.create({
            data: {
                name: roleName,
                companyId: companyId,
            },
        });

        return { role: newRole, errors: [] };
    } catch (error: any) {
        logger.error('Error creating role:', error);
        throw new Error(`Error creating role: ${error.message}`);
    }
}

const createNUpdateCompanyDeptForm = async (deptForm: any, ctxUser: z.infer<typeof loggedUserSchema>) => {
    try {

        const formCategory = await prisma.companyDeptFormCategory.upsert({
            where: {
                companyId_name: {
                    companyId: ctxUser.companyId,
                    name: deptForm.categoryName
                }
            },
            create: {
                name: deptForm.categoryName,
                companyId: ctxUser.companyId
            },
            update: {}
        });

        if (!formCategory) {
            throw new Error('Form category not found');
        }

        const upsertDept = await prisma.companyDept.upsert({
            where: {
                id: deptForm.companyDeptId || '', 
                companyId: ctxUser.companyId,
            },
            create: {
                name: deptForm.deptName,
                deptManagerId: ctxUser.id,
                companyId: ctxUser.companyId,
                companyForms: {
                    create: {
                        name: deptForm.name,
                        order: deptForm.order,
                        categoryId: formCategory?.id,
                        fields: {
                            create: []
                        },
                    },
                },
            },
            update: {},
        });


        let newDept = null;
        if (!deptForm.companyDeptFormId) {
            newDept = await prisma.companyDeptForm.create({
                data: {
                    name: deptForm.name,
                    order: deptForm.order,
                    dependentOnId: deptForm.dependentOnId,
                    categoryId: formCategory?.id,
                    companyDeptId: deptForm.companyDeptId,
                    fields: {
                        create: deptForm.subDeptFields.map((field: any) => ({
                            name: field.name,
                            fieldType: field.fieldType,
                            value: field.value,
                            imgLimit: field.imgLimit,
                            ddOptionId: field.ddOptionId,
                            options: field?.options?.length > 0 ? field.options : null,
                            order: field.order,
                            isDisabled: field.isDisabled,
                            isRequired: field.isRequired
                        }))
                    }
                },
                include: {
                    fields: true
                }
            });
        }

        if (deptForm.companyDeptFormId) {
            newDept = await prisma.companyDeptForm.update({
                where: {
                    id: deptForm.companyDeptFormId || '',
                },
                data: {
                    name: deptForm.name,
                    order: deptForm.order,
                    // dependentOnIds: deptForm.dependentOnId,
                    fields: {
                        deleteMany: {},
                        create: deptForm.subDeptFields.map((field: any) => ({
                            name: field.name,
                            fieldType: field.fieldType,
                            value: field.value,
                            imgLimit: field.imgLimit,
                            ddOptionId: field.ddOptionId,
                            options: field?.options?.length > 0 ? field.options : null,
                            order: field.order,
                            isDisabled: field.isDisabled,
                            isRequired: field.isRequired
                        }))
                    }
                },
                include: {
                    fields: true
                }
            });
        }

        await prisma.log.create({
            data: {
                logType: 'create',
                logData: JSON.stringify(newDept),
                description: `Created department form ${deptForm.name}`,
                userId: ctxUser.id,
                comapnyId: ctxUser.companyId || ""
            }
        });

        return newDept;
    } catch (error: any) {
        logger.error('Error creating department:', error);
        throw new Error(`Error creating department: ${error.message}`);
    }
};

const createNUpdateCompanyDeptOptForm = async (deptForm: any, ctxUser: z.infer<typeof loggedUserSchema>) => {
    // try {
    //     const newDept = await prisma.companyDeptOptForm.upsert({
    //         where: {
    //             companyId_name: {
    //                 companyId: ctxUser.companyId,
    //                 name: deptForm.name
    //             }
    //         },
    //         update: {
    //             name: deptForm.name,
    //             order: deptForm.order,
    //             companyId: ctxUser.companyId,
    //             subDeptFields: {
    //                 deleteMany: {},
    //                 create: deptForm.subDeptFields.map((field: any) => ({
    //                     name: field.name,
    //                     fieldType: field.fieldType,
    //                     value: field.value,
    //                     imgLimit: field.imgLimit,
    //                     ddOptionId: field.ddOptionId,
    //                     options: field.options,
    //                     order: field.order,
    //                     isDisabled: field.isDisabled,
    //                     isRequired: field.isRequired
    //                 }))
    //             }
    //         },
    //         create: {
    //             name: deptForm.name,
    //             order: deptForm.order,
    //             companyId: ctxUser.companyId,
    //             subDeptFields: {
    //                 create: deptForm.subDeptFields.map((field: any) => ({
    //                     name: field.name,
    //                     fieldType: field.fieldType,
    //                     value: field.value,
    //                     imgLimit: field.imgLimit,
    //                     ddOptionId: field.ddOptionId,
    //                     options: field.options,
    //                     order: field.order,
    //                     isDisabled: field.isDisabled,
    //                     isRequired: field.isRequired
    //                 }))
    //             }
    //         },
    //         include: {
    //             subDeptFields: true
    //         }
    //     });
    //     return newDept;
    // } catch (error: any) {
    //     logger.error('Error creating department:', error);
    //     throw new Error(`Error creating department: ${error.message}`);
    // }
};

//@aloksharma10 Is this still in use?
const createnUpdateCompanyDept = async (companyId: string, dept: z.infer<typeof createAdminDeptSchema>) => {
    // try {
    //     const fieldsToCreate = dept.deptFields.map(field => ({
    //         name: field.name,
    //         fieldType: field.fieldType,
    //         value: field.value,
    //         imgLimit: field.imgLimit,
    //         options: {
    //             create: field.options
    //         },
    //         order: field.order,
    //         isDisabled: field.isDisabled,
    //         isRequired: field.isRequired
    //     }));

    //     const company = await prisma.company.findFirst({
    //         where: { id: companyId },
    //     });

    //     if (!company) {
    //         throw new Error('Company not found.');
    //     }

    //     const newDept = await prisma.companyDept.upsert({
    //         where: {
    //             id: dept.id,
    //         },
    //         update: {
    //             companyForms: {
    //                 create: {
    //                     name: dept.subDeptName,
    //                     order: dept.order,
    //                     fields: {
    //                         create: fieldsToCreate
    //                     }
    //                 }
    //             }
    //         },
    //         create: {
    //             name: dept.name,
    //             deptManagerId: company?.companyManagerId,
    //             companyId,
    //             companyForms: {
    //                 create: {
    //                     name: dept.subDeptName,
    //                     order: dept.order,
    //                     fields: {
    //                         create: fieldsToCreate
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
};

const upsertCompanyDeptForm = async (formIds: string[], roleId: string, ctxUser: z.infer<typeof loggedUserSchema>) => {
    try{

        const role = await prisma.role.findFirst({
            where: {
                id: roleId
            }
        });

        if(!role){
            throw new Error('Role not found');
        }

        const upsertedForm = await prisma.role.update({
            where: {
                id: roleId,
                companyId: ctxUser.companyId
            },
            data: {
                companyDeptForm: {
                    connect: formIds.map(id => ({ id })) || [] 
                }
            }
        });

        return upsertedForm;
    } catch (error: any) {
        logger.error('Error creating department:', error);
        throw new Error(`Error creating department: ${error.message}`);
    }
}

// createDeptCompany: async ({ deptName, deptManagerId }: { deptName: string, deptManagerId: string }) => {
//     return await companyWorker.createDeptCompany(deptName, deptManagerId);
//   },
//   createCompanyRole: async ({ roleName }: { roleName: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
//     return await companyWorker.createCompanyRole(roleName, user.companyId);
//   },

const createDeptCompany = async (deptName: string, deptManagerId: string, companyId: string) =>{
    const dept = await prisma.companyDept.create({
        data: { 
            name: deptName,
            deptManagerId,
            companyId: companyId
        }
    })

    return dept;
}

export default {
    createDeptCompany,
    getFollowUps,
    getCompanyXchangerBids,
    getDepts,
    getCompanyDeptFields,
    createnUpdateCompanyDept,
    createRole,
    createNUpdateCompanyDeptForm,
    createNUpdateCompanyDeptOptForm,
    getCompanyDeptOptFields,
    upsertCompanyDeptForm
}