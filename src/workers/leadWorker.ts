import { z } from "zod";
import { formatISO, parse } from "date-fns";
import prisma from "../config/database";
import logger from "../utils/logger";
import { leadUtils } from "../utils";
import { CallStatus, FieldType, FormValue, PaymentStatus, Status } from "@prisma/client";
import { createLeadSchema, leadAssignToSchema, leadBidSchema, prospectAssignToSchema, submitFeedbackSchema } from "../types/lead";
import { loggedUserSchema } from "../types/user";
import { followUpUpdater, formatReturnOfDB, getColumnNames } from "../utils/lead-worker-utils";

const getAllLeads = async () => {
    try {
        const leads = await prisma.lead.findMany({
            include: {
                company: true,
                bids: true,
            },
        });

        return leads;
    } catch (error) {
        logger.error('Error fetching Leads:', error);
        return [];
    }
}

const getAllProspects = async () => {
    try {
        const prospects = await prisma.prospect.findMany({
            include: {
                company: true,
                followUps: true
            },
        });

        return prospects;
    } catch (error) {
        logger.error('Error fetching Prospects:', error);
        return [];
    }
}

const getLeadsByDateRange = async (companyId: string, fromDateStr: string, toDateStr: string): Promise<{
    callCount: number,
    totalPayCollectedCount: number
    numberOfLeads: number
    groupedCallPerday: {
        [key: string]: number;
    }
    leadsWithFeedbackByRole: {
        [roleName: string]: number;
    }
} | []> => {

    try {
        const fromDate = parse(fromDateStr, 'dd/MM/yyyy', new Date());
        const toDate = parse(toDateStr, 'dd/MM/yyyy', new Date());

        const leads = await prisma.lead.findMany({
            where: {
                companyId,
                createdAt: {
                    gte: fromDate,
                    lte: toDate
                }
            },
            include: {
                submittedForm: {
                    include: {
                        formValue: true,
                        member: {
                            include: {
                                role: true
                            }
                        }
                    }
                },
                bids: {
                    include: {
                        member: true
                    }
                }
            }
        });

        const number = leads.length

        // TODO: Calc totalLeads in which any member has given feedback based on member role
        const leadsWithFeedbackByRole = leads.reduce((acc: { [roleName: string]: number }, lead) => {
            lead.submittedForm.forEach((feedback: any) => {
                if (feedback.member && feedback.member.role && feedback.feedback.length > 0) {
                    const roleName = feedback.member.role.name;
                    // Exclude roles 'manager' and 'root'
                    if (roleName.toLowerCase() !== 'manager' && roleName.toLowerCase() !== 'root') {
                        if (acc[roleName]) {
                            acc[roleName]++;
                        } else {
                            acc[roleName] = 1;
                        }
                    }
                }
            });
            return acc;
        }, {});


        // totalPayCollectedCount
        const totalAmtCollected = leads.reduce((totalAmt: number, lead) => {
            lead.submittedForm.forEach((feedback: any) => {
                if (feedback?.formName?.includes('Payment')) {
                    feedback?.feedback?.forEach((item: FormValue) => {
                        if (item.name === 'amount') {
                            totalAmt += parseFloat(String(item?.value ?? '0'));
                        }
                    });
                }
            });
            return totalAmt;
        }, 0);

        // callCount
        const callSuccessLeadCount = leads.filter(lead => lead.callStatus === CallStatus.SUCCESS).length;

        // groupedCallPerday
        const calcDailyCallMadeEachDay = leads.reduce((acc: { [key: string]: number }, lead) => {
            const date = lead.createdAt.toISOString().split('T')[0];
            acc[date] = acc[date] ? acc[date] + 1 : 1;
            return acc;
        }, {});

        return {
            callCount: callSuccessLeadCount,
            totalPayCollectedCount: totalAmtCollected,
            groupedCallPerday: calcDailyCallMadeEachDay,
            numberOfLeads: number,
            leadsWithFeedbackByRole
        };
    } catch (error) {
        logger.error('Error fetching Leads:', error);
        return [];
    }
}


const getAssignedLeads = async (userId: string, companyId?: string) => {
    try {
        // Construct the where clause based on whether companyId is provided
        const whereClause = companyId
            ? {
                companyId,
                leadMember: {
                    some: { memberId: userId }
                }
            }
            : {
                leadMember: {
                    some: { memberId: userId }
                }
            };

        // Fetch the leads with the constructed where clause
        const leads = await prisma.lead.findMany({
            where: whereClause,
            include: {
                company: true,
                leadMember: {
                    include: {
                        member: true,
                    },
                },
                submittedForm: {
                    include: {
                        formValue: true,
                        member: {
                            include: {
                                role: true
                            }
                        }
                    }
                },
                // Feedbacks: true,
                bids: {
                    include: {
                        member: true
                    }
                },
            },
        });

        return leads;
    } catch (error: any) {
        throw new Error(`Error fetching assigned leads: ${error.message}`);
    }
};

const getCompanyLeads = async (companyId: string) => {
    try {
        const leads = await prisma.lead.findMany({
            where: {
                companyId,
            },
            include: {
                leadMember: {
                    include: {
                        member: true,
                    },
                },
                submittedForm: {
                    include: {
                        formValue: true,
                        dependentOnValue: true,
                        member: {
                            include: {
                                role: true,
                            },
                        },
                    },
                },
                bids: {
                    include: {
                        member: true,
                    },
                },
                followUps: true
            },
            orderBy: {
                createdAt: 'desc', // Sorting by non-nullable createdAt field
            },
        });

        // const leadsWithUniqueFeedback = leads.map(lead => {
        //     lead.submittedForm.forEach(feedbackEntry => {
        //         const feedbackMap = new Map<string, typeof feedbackEntry.formValue[0]>();

        //         feedbackEntry.formValue.forEach(item => {
        //             const key = `${item.name}-${item.fieldType}`;
        //             feedbackMap.set(key, item);  // Override if key already exists
        //         });

        //         feedbackEntry.formValue = Array.from(feedbackMap.values());
        //     });

        //     return lead;
        // });



        return {
            lead: leads,
        };

    } catch (error: any) {
        logger.error('Error fetching Leads:', error);
        throw new Error(`Error fetching leads: ${error.message}`);
    }
};

const getCompanyProspects = async (companyId: string) => {
    try {
        const prospects = await prisma.prospect.findMany({
            where: {
                companyId
            },
            include: {
                followUps: true,
                company: {
                    include: {
                        Depts: {
                            include: {
                                companyForms: {
                                    include: {
                                        fields: true
                                    }
                                }
                            }
                        },
                    }
                }
            }
        })
        return prospects;
    } catch (error: any) {
        throw new Error(`Error getCompanyProspects leads: ${error.message}`);

    }
}

const getCompanyLeadById = async (companyId: string, leadId: string) => {
    try {
        const lead = await prisma.lead.findFirst({
            where: {
                companyId,
                id: leadId,
            },
            include: {
                company: true,
                leadMember: {
                    include: {
                        member: true
                    }
                },
                submittedForm: {
                    include: {
                        formValue: true,
                        member: {
                            include: {
                                role: true
                            }
                        }
                    }
                },
                bids: {
                    include: {
                        member: true
                    }
                },
            },
        });

        return lead;
    } catch (error) {
        logger.error('Error fetching Leads:', error);
        return null;
    }
}

const getTransferedLeads = async (userId: string) => {
    try {
        const leads = await prisma.lead.findMany({
            where: {
                leadTransferTo: {
                    some: {
                        transferById: userId,
                    },
                },
            },
            include: {
                leadTransferTo: {
                    include: {
                        transferTo: {
                            include: {
                                role: true
                            }
                        },
                        transferBy: {
                            include: {
                                role: true
                            }
                        },
                    }
                },
            },
        });

        return leads;
    } catch (error: any) {
        logger.error('Error fetching transfered leads:', error);
        throw new Error(`Error fetching transfered leads: ${error.message}`);
    }
}

const createProspect = async (prspct: z.infer<typeof createLeadSchema>, userName: string) => {
    try {
        const company = await prisma.company.findFirst({
            where: { id: prspct.companyId },
        });

        if (!company) {
            throw new Error("Company not found");
        }

        const isProspectExists = await prisma.prospect.findFirst({
            where: {
                OR: [
                    { email: prspct.email },
                    { phone: prspct.phone },
                ]
            },
        });

        if (isProspectExists) {
            throw new Error("Prospect already exists with the same email or phone number");
        }

        const companyManager = await prisma.member.findFirst({
            where: {
                id: company.companyManagerId,
                companyId: prspct.companyId,
            },
        });

        if (!companyManager) {
            throw new Error("Company manager not found");
        }

        const formattedVehicleDate = prspct.vehicleDate
            ? formatISO(parse(prspct.vehicleDate, 'dd-MM-yyyy', new Date()))
            : null;

        const newLead = await prisma.prospect.create({
            data: {
                companyId: prspct.companyId,
                name: prspct.name,
                email: prspct.email,
                phone: prspct.phone,
                alternatePhone: prspct.alternatePhone,
                rating: prspct.rating,
                callStatus: CallStatus.PENDING, // or PENDING
                paymentStatus: PaymentStatus.PENDING, // or PENDING
                remark: prspct.remark,
                dynamicFieldValues: prspct.dynamicFieldValues,
                companyDeptId: prspct.department,
                via: `Manually: ${userName}`
            },
        });

        return { lead: newLead, errors: [] };
    } catch (error: any) {
        logger.error('Error creating lead:', error);
        throw new Error(`Error creating lead: ${error.message}`);
    }
};

const createLead = async (lead: z.infer<typeof createLeadSchema>, user: z.infer<typeof loggedUserSchema>) => {
    try {
        const newLead = await prisma.lead.create({
            data: {
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                alternatePhone: lead.alternatePhone,
                rating: lead.rating,
                remark: lead.remark,
                via: `Manually: ${user.name}`,
                companyId: user.companyId,
                companyDeptId: lead.department,
                dynamicFieldValues: lead.dynamicFieldValues,
            },
        });

        return newLead;
    } catch (error: any) {
        logger.error('Error updating Lead:', error);
        throw new Error(`Error updating Lead: ${error.message}`);
    }
}

const updateLead = async (lead: z.infer<typeof createLeadSchema>) => {
    try {
        const updatedLead = await prisma.lead.update({
            where: {
                id: lead.id,
            },
            data: {
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                alternatePhone: lead.alternatePhone,
                rating: lead.rating,
            },
        });

        return updatedLead;
    } catch (error: any) {
        logger.error('Error updating Lead:', error);
        throw new Error(`Error updating Lead: ${error.message}`);
    }
}

const approveLead = async (leadId: string, status: boolean, userName: string) => {
    const prospect = await prisma.prospect.update({
        where: {
            id: leadId
        },
        data: {
            isLeadConverted: true,
        },
        include: {
            followUps: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    })

    if (!prospect) throw new Error("Prospect not found!");

    const companyOwner = await prisma.member.findFirst({
        where: {
            companyId: prospect.companyId,
            role: {
                name: "Root"
            }
        }
    })

    if (!companyOwner) throw new Error("Company Not found!")

    const prospectToLead = await prisma.lead.upsert({
        where: {
            email_phone: {
                email: prospect.email,
                phone: prospect.phone
            }
        },
        create: {
            name: prospect.name,
            email: prospect.email,
            phone: prospect.phone,
            alternatePhone: prospect.alternatePhone,
            rating: prospect.rating,
            companyId: prospect.companyId,
            remark: prospect.remark,
            via: `Manually: ${companyOwner.name}`,
            companyDeptId: prospect.companyDeptId,
            followUps: {
                create: {
                    nextFollowUpDate: prospect.followUps[0]?.nextFollowUpDate,
                    followUpBy: userName,
                    remark: "Lead Converted from Prospect",
                }
            }
        },
        update: {
            name: prospect.name,
            email: prospect.email,
            phone: prospect.phone,
            alternatePhone: prospect.alternatePhone,
            rating: prospect.rating,
            companyId: prospect.companyId,
        }
    })

    await prisma.leadMember.upsert({
        where: {
            leadId_memberId: {
                leadId: prospectToLead.id,
                memberId: companyOwner.id
            }
        },
        update: {},
        create: {
            leadId: prospectToLead.id,
            memberId: companyOwner.id
        }
    }).catch(err => {
        if (err.code === 'P2002') {
            throw new Error("Error assigning lead to company owner")
        }
        logger.error('Error assigning lead to company owner:', err);
    });


    // await prisma.prospect.delete({
    //     where: {
    //         id: prospect.id
    //     }
    // })

    return prospectToLead;
}

const leadAssignTo = async ({ companyId, leadIds, deptId, userIds, description }: z.infer<typeof leadAssignToSchema>) => {
    try {
        if (!Array.isArray(leadIds)) {
            throw new Error("leadIds must be an array of lead IDs");
        }

        if (!Array.isArray(userIds)) {
            throw new Error("userIds must be an array of user IDs");
        }

        // Fetch leads to ensure they exist and belong to the company
        const leads = await prisma.lead.findMany({
            where: {
                companyId,
                id: {
                    in: leadIds,
                },
            },
        });

        if (leads.length !== leadIds.length) {
            throw new Error("Some leads not found or not part of the company");
        }

        // Fetch members to ensure they exist and belong to the company and department
        const members = await prisma.member.findMany({
            where: {
                companyId,
                id: {
                    in: userIds,
                },
            },
        });

        if (members.length !== userIds.length) {
            throw new Error("Some members not found or not part of the company or department");
        }

        await prisma.leadMember.deleteMany({
            where: {
                leadId: {
                    in: leadIds,
                },
            },
        });

        // Upsert leadMember entries
        for (const leadId of leadIds) {
            for (const userId of userIds) {
                await prisma.leadMember.upsert({
                    where: {
                        leadId_memberId: {
                            leadId,
                            memberId: userId,
                        },
                    },
                    update: {},
                    create: {
                        leadId,
                        memberId: userId,
                    },
                });
            }
        }

        // Fetch updated leads with their LeadStatus and leadMembers
        const updatedLeadsWithRelations = await prisma.lead.findMany({
            where: {
                id: {
                    in: leadIds,
                },
            },
            include: {
                leadMember: {
                    include: {
                        member: true,
                    },
                },
            },
        });


        return updatedLeadsWithRelations;
    } catch (error: any) {
        logger.error('Error assigning Leads:', error);
        throw new Error(`Error Assigning Leads: ${error.message}`);
    }
}

const prospectAssignTo = async ({ companyId, prospectIds, deptId, userIds, description }: z.infer<typeof prospectAssignToSchema>) => {
    try {
        if (!Array.isArray(prospectIds)) {
            throw new Error("prospectIds must be an array of lead IDs");
        }

        if (!Array.isArray(userIds)) {
            throw new Error("userIds must be an array of user IDs");
        }

        // Fetch leads to ensure they exist and belong to the company
        const leads = await prisma.prospect.findMany({
            where: {
                companyId,
                id: {
                    in: prospectIds,
                },
            },
        });

        if (leads.length !== prospectIds.length) {
            throw new Error("Some leads not found or not part of the company");
        }

        // Fetch members to ensure they exist and belong to the company and department
        const members = await prisma.member.findMany({
            where: {
                companyId,
                id: {
                    in: userIds,
                },
            },
        });

        if (members.length !== userIds.length) {
            throw new Error("Some members not found or not part of the company or department");
        }

        await prisma.prospectMember.deleteMany({
            where: {
                prospectId: {
                    in: prospectIds,
                },
            },
        });

        // Upsert leadMember entries
        for (const prospectId of prospectIds) {
            for (const userId of userIds) {
                await prisma.prospectMember.upsert({
                    where: {
                        prospectId_memberId: {
                            prospectId,
                            memberId: userId,
                        },
                    },
                    update: {},
                    create: {
                        prospectId,
                        memberId: userId,
                    },
                });
            }
        }

        // Fetch updated leads with their LeadStatus and leadMembers
        const updatedLeadsWithRelations = await prisma.prospect.findMany({
            where: {
                id: {
                    in: prospectIds,
                },
            },
            include: {
                leadMember: {
                    include: {
                        member: true,
                    },
                },
            },
        });


        return updatedLeadsWithRelations;
    } catch (error: any) {
        logger.error('Error assigning Leads:', error);
        throw new Error(`Error Assigning Leads: ${error.message}`);
    }
}

const leadTransferTo = async ({ leadId, transferToId }: { leadId: string, transferToId: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
    try {
        const lead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                companyId: user.companyId,
            },
            include: {
                submittedForm: true
            }
        });

        if (!lead) {
            throw new Error("Lead not found");
        }

        const member = await prisma.member.findFirst({
            where: {
                id: transferToId,
                companyId: user.companyId,
            },
        });

        if (!member) {
            throw new Error("Member not found");
        }

        const leadTransfer = await prisma.leadTransferTo.create({
            data: {
                leadId,
                leadData: lead.submittedForm,
                transferToId,
                transferById: user.id,
            },
        });


        const updateLeadProspectFollow = await followUpUpdater(leadId, `Lead Transfered to ${member.name}`, user.name);

        const updatedLead = await prisma.lead.update({
            where: {
                id: leadId,
            },
            data: {
                leadMember: {
                    deleteMany: {},
                    create: {
                        memberId: transferToId,
                    },
                },
            },
        });

        return updatedLead;
    } catch (error: any) {
        logger.error('Error transferring lead:', error);
        throw new Error(`Error transferring lead: ${error.message}`);
    }
}

const submitFeedback = async ({ deptId, leadId, callStatus, paymentStatus, feedback, childFormValue, urls, submitType, formName, dependentOnFormName, nextFollowUpDate }: z.infer<typeof submitFeedbackSchema>, user: any) => {
    try {

        const dept = await prisma.companyDept.findFirst({
            where: {
                id: deptId,
            },
        });

        if (!dept) {
            throw new Error("Department not found")
        }

        const company = await prisma.company.findFirst({
            where: {
                id: dept.companyId || "",
            },
        });

        if (!company) {
            throw new Error("Company not found")
        }

        const lead = await prisma.lead.update({
            where: {
                id: leadId,
            },
            data: {
                callStatus,
                paymentStatus,
            }
        });

        if (!lead) {
            throw new Error("Lead not found")
        }

        const feedbackData = feedback.map((fb: any) => ({
            name: fb.name,
            value: fb.value,
            fieldType: (fb.fieldType as FieldType),
        }));

        const dependentOnValue = childFormValue?.length > 0
            ? childFormValue.map((fb: any) => ({
                name: fb.name,
                value: fb.value,
                fieldType: fb.fieldType as FieldType,
            })) : [];


        if (formName.toUpperCase() === "LEAD FOLLOW UP" || (dependentOnFormName && dependentOnFormName.toUpperCase() === "LEAD FOLLOW UP")) {
            const customerResponse = feedback.find((fb: any) => fb.name === "customerResponse")?.value;
            const remark = feedback.find((fb: any) => fb.name === "remark")?.value;

            const followUp = await prisma.leadFollowUp.create({
                data: {
                    leadId,
                    nextFollowUpDate,
                    followUpBy: user.name,
                    customerResponse: customerResponse,
                    remark: remark || "",
                    dynamicFieldValues: dependentOnFormName ? dependentOnValue : feedback,
                }
            })
        } else {

            const newFeedback = await prisma.submittedForm.upsert({
                where: {
                    formName_leadId_memberId: {
                        formName,
                        leadId: leadId,
                        memberId: user.id,
                    },
                },
                update: {
                    dependentOnFormName,
                    formValue: {
                        deleteMany: {
                            name: {
                                in: feedbackData.map(fb => fb.name),
                            },
                        },
                        ...(feedbackData.length > 0 && {
                            createMany: {
                                data: feedbackData,
                            },
                        }),
                    },
                    dependentOnValue: {
                        deleteMany: {
                            name: {
                                in: dependentOnValue.map((fb: any) => fb.name),
                            },
                        },
                        ...(dependentOnValue.length > 0 && {
                            createMany: {
                                data: dependentOnValue,
                            },
                        }),
                    },
                    formName,
                },
                create: {
                    formName,
                    dependentOnFormName,
                    ...(feedbackData.length > 0 && {
                        formValue: {
                            createMany: {
                                data: feedbackData,
                            },
                        },
                    }),
                    ...(dependentOnValue.length > 0 && {
                        dependentOnValue: {
                            createMany: {
                                data: dependentOnValue,
                            },
                        },
                    }),
                    lead: {
                        connect: { id: leadId },
                    },
                    member: {
                        connect: { id: user.id },
                    },
                },
                include: {
                    formValue: true,
                    dependentOnValue: true,
                },
            });

        }


        if (submitType === leadUtils.SUBMIT_TO_MANAGER) {
            const updatedLead = await prisma.lead.update({
                where: {
                    id: leadId,
                },
                data: {
                    leadMember: {
                        deleteMany: {},
                        create: {
                            memberId: company.companyManagerId,
                        }
                    }
                }
            });
        }


        return { lead: lead, message: "Updated Successfully!", errors: [] };
    } catch (error: any) {
        logger.error('Error updating Lead:', error);
        throw new Error(`Error Submitting Lead Feedback: ${error.message}`);
    }
}

const submitBid = async ({ deptId, leadId, companyId, bidAmount, description }: z.infer<typeof leadBidSchema>, userId: string) => {
    try {
        const dept = await prisma.companyDept.findFirst({
            where: { id: deptId },
        });
        if (!dept) {
            throw new Error("Department not found");
        }

        const company = await prisma.company.findFirst({
            where: { id: companyId },
        });
        if (!company) {
            throw new Error("Company not found");
        }

        const member = await prisma.member.findFirst({
            where: {
                id: userId,
                companyId,
            },
        });
        if (!member) {
            throw new Error("Member not found");
        }

        const lead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                companyId,
            },
        });
        if (!lead) {
            throw new Error("Lead not found");
        }

        const isBidExists = await prisma.bid.findFirst({
            where: {
                leadId,
                memberId: userId,
            },
        });
        if (isBidExists) {
            throw new Error("Bid already submitted for this lead");
        }

        const newBid = await prisma.bid.create({
            data: {
                bidAmount: parseFloat(bidAmount),
                description,
                lead: { connect: { id: leadId } },
                member: { connect: { id: userId } },
            },
        });

        // Remove the member from the leadMember table
        // await prisma.leadMember.delete({
        //     where: {
        //         leadId_memberId: {
        //             leadId,
        //             memberId: userId,
        //         },
        //     },
        // });

        return newBid;
    } catch (error) {
        logger.error('Error submitting bid:', error);
        throw error;
    }
};

const getLeadBids = async (leadId: string) => {
    const bids = await prisma.bid.findMany({
        where: {
            leadId,
        },
        include: {
            member: true,
        },
    });

    return bids;
}

const updateLeadFinanceStatus = async (leadId: string, financeStatus: boolean, userId: string, companyId: string) => {
    try {
        const company = await prisma.company.findFirst({
            where: {
                id: companyId,
            },
        });

        if (!company) {
            throw new Error("Company not found");
        }

        const updatedLead = await prisma.lead.update({
            where: {
                id: leadId,
            },
            data: {
                // isFinancedApproved: financeStatus,
            },
        });

        const lead = await prisma.leadMember.delete({
            where: {
                leadId_memberId: {
                    leadId,
                    memberId: userId
                },
            }
        });

        const updatedleadMember = await prisma.leadMember.create({
            data: {
                leadId,
                memberId: company.companyManagerId,
            },
        });

        return updatedLead;
    } catch (error: any) {
        logger.error('Error updating Lead:', error);
        throw new Error(`Error updating Lead: ${error.message}`);
    }
}

const updateLeadFollowUpDate = async (feedback: any, leadId: string, nextFollowUpDate: string, remark: string, customerResponse: string, rating: string, memberName: string) => {
    try {
        const feedbackData = feedback.map((fb: any) => ({
            name: fb.name,
            value: fb.value,
            fieldType: (fb.fieldType as FieldType),
        }));

        const updatedLead = await prisma.lead.update({
            where: {
                id: leadId,
            },
            data: {
                followUps: {
                    create: {
                        nextFollowUpDate: nextFollowUpDate,
                        followUpBy: memberName,
                        remark,
                        customerResponse,
                        rating,
                        dynamicFieldValues: feedbackData
                    },
                },
            },
        });

        return updatedLead;
    } catch (error: any) {
        logger.error('Error updating Lead:', error);
        throw new Error(`Error updating Lead: ${error.message}`);
    }
}

const updateProspectFollowUpDate = async (feedback: any, leadId: string, nextFollowUpDate: string, remark: string, customerResponse: string, rating: string, memberName: string) => {
    try {
        const feedbackData = feedback.map((fb: any) => ({
            name: fb.name,
            value: fb.value,
            fieldType: (fb.fieldType as FieldType),
        }));

        const updatedLead = await prisma.prospect.update({
            where: {
                id: leadId,
            },
            data: {
                followUps: {
                    create: {
                        nextFollowUpDate: nextFollowUpDate,
                        followUpBy: memberName,
                        remark,
                        customerResponse,
                        rating,
                        dynamicFieldValues: feedbackData
                    },
                },
            },
        });

        return updatedLead;
    } catch (error: any) {
        logger.error('Error updating Lead:', error);
        throw new Error(`Error updating Lead: ${error.message}`);
    }
}

const getFollowUpByLeadId = async (leadId: string) => {
    try {
        // const followUps = await prisma.followUp.findMany({
        //     where: {
        //         leadId,
        //     },
        //     include: {
        //         followUpBy: true,
        //     },
        // });

        // return followUps;
    } catch (error: any) {
        logger.error('Error fetching followups:', error);
        throw new Error(`Error fetching followups: ${error.message}`);
    }
}

const updateLeadPaymentStatus = async (leadId: string, paymentStatus: PaymentStatus | string) => {
    try {
        const updatedLead = await prisma.lead.update({
            where: {
                id: leadId,
            },
            data: {
                paymentStatus: paymentStatus?.toUpperCase() as PaymentStatus,
            },
        });

        return updatedLead;
    } catch (error: any) {
        logger.error('Error updating Lead:', error);
        throw new Error(`Error updating Lead: ${error.message}`);
    }
}

const xChangerCustomerList = async (companyId: string) => {
    try {
        const leads = await prisma.lead.findMany({
            where: {
                AND: [
                    { companyId },
                    // { status: Status.OPEN },
                    {
                        submittedForm: {
                            some: { formName: "Exchange" }
                        }
                    }
                ]
            },
            include: {
                submittedForm: {
                    where: { formName: "Exchange" },
                    include: {
                        member: true,
                        formValue: true
                    }
                }
            }
        })
        return formatReturnOfDB(leads as any)
    } catch (error: any) {
        logger.error('Error xChangerCustomerList:', error);
        throw new Error(`Error xChangerCustomerList: ${error.message}`);
    }
}

const getLeadPhotos = async (companyId: string) => {
    try {
        const leads = await prisma.lead.findMany({
            where: {
                companyId,
                submittedForm: {
                    some: {
                        formValue: {
                            some: {
                                fieldType: "DD_IMG"
                            }
                        }
                    }
                }
            },
            select: {
                submittedForm: {
                    where: {
                        formValue: {
                            some: {
                                fieldType: "DD_IMG"
                            }
                        }
                    },
                    include: {
                        formValue: {
                            where: {
                                fieldType: "DD_IMG"
                            }
                        }
                    }
                }
            }
        });
        return formatReturnOfDB(leads as any)
    } catch (error: any) {
        logger.error('Error getLeadPhotos:', error);
        throw new Error(`Error getLeadPhotos: ${error.message}`);
    }
}

const getExchangeLeadImgs = async (companyId: string) => {
    try {
        const exchangeLeads = await prisma.lead.findMany({
            where: {
                companyId,
                submittedForm: {
                    some: {
                        formName: "Exchange",
                        formValue: {
                            some: {
                                fieldType: "IMAGE"
                            }
                        }
                    }
                }
            },
            select: {
                submittedForm: {
                    where: {
                        formName: "Exchange",
                        formValue: {
                            some: {
                                fieldType: "IMAGE"
                            }
                        }
                    },
                    include: {
                        member: true,
                        formValue: {
                            where: {
                                fieldType: "IMAGE"
                            }
                        }
                    }
                }
            }
        });

        return formatReturnOfDB(exchangeLeads as any);
    } catch (error: any) {
        logger.error('Error getExchangeLeadImgs:', error);
        throw new Error(`Error getExchangeLeadImgs: ${error.message}`);
    }
}

const getFormValuesByFormName = async (companyId: string, formName: string) => {
    try {
        const leads = await prisma.lead.findMany({
            where: {
                companyId,
                submittedForm: {
                    some: { formName: { in: [formName] } }
                }
            },
            select: {
                submittedForm: {
                    where: { formName: { in: [formName] } },
                    include: {
                        member: true,
                        formValue: true
                    }
                }
            }
        })

        const forms = await prisma.submittedForm.findMany({
            where: {
                lead: {
                    companyId,
                },
                formName
            },
            include: {
                dependentOnValue: true,
                formValue: true,
            }
        })

        return formatReturnOfDB(forms)
    } catch (error: any) {
        logger.error('Error getFormValuesByFormName:', error);
        throw new Error(`Error getFormValuesByFormName: ${error.message}`);
    }
}

const editLeadFormValue = async (submittedFormId: string, formValue: any) => {
    try {
        const submittedForm = await prisma.submittedForm.update({
            where: {
                id: submittedFormId
            },
            data: {
                dependentOnValue: {
                    deleteMany: {
                        name: {
                            in: formValue.map((item: any) => item.name)
                        }
                    },
                    createMany: {
                        data: formValue.map((item: any) => ({
                            name: item.name,
                            value: item.value,
                            fieldType: item.fieldType
                        }))
                    }
                }
            },
            include: {
                dependentOnValue: true,
                formValue: true
            }
        })

        return submittedForm;
    } catch (error) {
        console.log('error', error);
    }
}


export default {
    editLeadFormValue,
    getAllLeads,
    getLeadBids,
    getCompanyLeads,
    getCompanyProspects,
    getCompanyLeadById,
    getAssignedLeads,
    createProspect,
    createLead,
    updateLead,
    approveLead,
    leadAssignTo,
    prospectAssignTo,
    submitFeedback,
    submitBid,
    updateLeadFinanceStatus,
    getLeadsByDateRange,
    updateLeadFollowUpDate,
    updateProspectFollowUpDate,
    leadTransferTo,
    getTransferedLeads,
    updateLeadPaymentStatus,
    getFollowUpByLeadId,
    getAllProspects,
    xChangerCustomerList,
    getLeadPhotos,
    getFormValuesByFormName,
    getExchangeLeadImgs
}