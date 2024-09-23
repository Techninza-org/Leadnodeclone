import logger from '../utils/logger';
import prisma from '../config/database';
import { z } from 'zod';
import { createRoleSchema } from '../types/admin';
import { createAdminDeptSchema } from '../types/dept';
import { Plan } from '@prisma/client';

export const getDeptWFields = async () => {
    const dept = await prisma.adminDept.findMany({
        include: {
            deptFields: {
                include: {
                    subDeptFields: true
                },
                orderBy: {
                    order: 'desc',
                }
            },
        },
    });

    if (!dept) {
        throw new Error('Department not found.');
    }
    return dept;
}

const getPlans = async () => {
    try {
        const plans = await prisma.plan.findMany({
            include: {
                Subscriptions: true
            }
        });
        return plans;
    } catch (error: any) {
        throw new Error('Error fetching plans');
    }
}

export const getRootUsers = async () => {
    try {
        const rootUsers = await prisma.member.findMany({
            where: {
                role: {
                    name: 'Root',
                },
            },
            include: {
                Company: {
                    include: {
                        Subscriptions: {
                            include: {
                                plan: true
                            }
                        },
                    },
                },
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
                        subDeptFields: true
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
                    subDeptFields: {
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
                    subDeptFields: {
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
                        subDeptFields: true
                    }
                }
            }
        });


        return updatedDept;
    } catch (error: any) {
        console.error('Error updating department:', error);
        throw new Error(`Error updating department: ${error.message}`);
    }
};

const createNUpdateSubscriptionPlan = async (plan: Plan) => {
    try {
        const newPlan = await prisma.plan.upsert({
            where: {
                name: plan.name,
            },
            update: {
                name: plan.name,
                price: plan.price,
                description: plan.description,
                rank: plan.rank,
                duration: plan.duration,
                maxUsers: plan.maxUsers,
                isActive: plan.isActive,
                // Only update defaultAllowedDeptsIds if it's provided
                ...(plan.defaultAllowedDeptsIds && {
                    defaultAllowedDeptsIds: {
                        set: plan.defaultAllowedDeptsIds
                    }
                })
            },
            create: {
                name: plan.name,
                price: plan.price,
                rank: plan.rank,
                description: plan.description,
                duration: plan.duration,
                maxUsers: plan.maxUsers,
                isActive: plan.isActive,
                // Only set defaultAllowedDeptsIds if it's provided
                defaultAllowedDeptsIds: plan.defaultAllowedDeptsIds ?? []
            },
        });

        return newPlan;
    } catch (error: any) {
        throw new Error(`Error creating or updating subscription plan: ${error.message}`);
    }
};


const updateCompanySubscription = async (companyId: string, planId: string, allowedDeptsIds: string[], startDate: Date, endDate: Date) => {
    try {
        const isCompanyExists = await prisma.company.findUnique({
            where: {
                id: companyId
            },
            include: {
                Depts: {
                    include: {
                        companyDeptForms: true
                    }
                }
            }
        });

        if (!isCompanyExists) {
            throw new Error('Company not found.');
        }

        const alreadyAllowedDepts = await prisma.companyDeptForm.findMany({
            where: {
                companyDept: {
                    companyId: companyId
                },
            },
        });

        const alreadyAllowedDeptsIdsArr = alreadyAllowedDepts.map(dept => dept.adminDeptFieldId).filter((id): id is string => id !== null);

        // add or remove depts as allowedDeptsIds
        const deptsToAdd = allowedDeptsIds.filter(deptId => !alreadyAllowedDeptsIdsArr.includes(deptId));
        const deptsToRemove = alreadyAllowedDeptsIdsArr.filter((deptId: string) => !allowedDeptsIds.includes(deptId));

        const existingDepts = await prisma.adminDept.findMany({
            where: {
                deptFields: {
                    some: {
                        id: {
                            in: deptsToAdd || [],
                        }
                    }
                }
            },
            include: {
                deptFields: {
                    where: {
                        id: {
                            in: deptsToAdd || [],
                        }
                    },
                    include: {
                        subDeptFields: true,
                    },
                },
            },
        });

        const deptsArray = existingDepts.map(dept => ({
            name: dept.name,
            deptManagerId: isCompanyExists.companyManagerId,
            companyDeptForms: {
                create: dept.deptFields.map(field => ({
                    name: field.name,
                    order: field.order,
                    adminDeptFieldId: field.id,
                    subDeptFields: {
                        create: field.subDeptFields.map(subField => ({
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

        // update or create depts
        for (const dept of deptsArray) {
            const matchingDept = isCompanyExists.Depts.find(
                (existingDept) => existingDept.name === dept.name
            );

            if (matchingDept) {
                await prisma.companyDept.update({
                    where: {
                        id: matchingDept.id,
                    },
                    data: {
                        name: dept.name,
                        deptManagerId: dept.deptManagerId,
                        companyDeptForms: dept.companyDeptForms,
                    },
                });

            } else {
                const b = await prisma.companyDept.create({
                    data: {
                        name: dept.name,
                        deptManagerId: dept.deptManagerId,
                        companyDeptForms: dept.companyDeptForms,
                        companyId,
                    },
                });

                console.log(b, "b")
            }
        }

        // remove depts
        await prisma.companyDeptForm.deleteMany({
            where: {
                adminDeptFieldId: {
                    in: deptsToRemove
                },
                companyDept: {
                    companyId: companyId
                }
            }
        });

        // update company subscription
        const updatedCompany = await prisma.company.update({
            where: {
                id: companyId,
            },
            data: {
                Subscriptions: {
                    create: {
                        allowedDeptsIds,
                        planId: planId,
                        startDate,
                        endDate
                    }
                }
            },
        });

        return updatedCompany;
    } catch (error: any) {
        throw new Error(`Error updating company subscription: ${error.message}`);
    }
}

export const getCompanySubscription = async (companyId: string) => {

    try {
        const company = await prisma.company.findUnique({
            where: {
                id: companyId,
            },
            include: {
                Subscriptions: {
                    include: {
                        plan: true
                    }
                }
            }
        });


        return company;
    } catch (error: any) {
        throw new Error(`Error fetching company subscription: ${error.message}`);
    }
}

export default {
    getDeptsAdmin,
    getRoles,
    getPlans,
    getDeptWFields,
    getRootUsers,
    createRole,
    createDept,
    updateDept,
    createNUpdateSubscriptionPlan,
    updateCompanySubscription,
    getCompanySubscription,
}