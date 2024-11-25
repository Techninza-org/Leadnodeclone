import { z } from "zod";
import { formatISO, parse } from "date-fns";
import prisma from "../config/database";
import logger from "../utils/logger";
import { leadUtils } from "../utils";
import { CallStatus, Feedbacks, FieldType, PaymentStatus, Status } from "@prisma/client";
import { createLeadSchema, leadAssignToSchema, leadBidSchema, submitFeedbackSchema } from "../types/lead";
import { loggedUserSchema } from "../types/user";
import { formatReturnOfDB } from "../utils/lead-worker-utils";

const getAllLeads = async () => {
    try {
        const leads = await prisma.lead.findMany({
            include: {
                Company: true,
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
                Company: true,
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
                LeadFeedback: {
                    include: {
                        feedback: true,
                        member: {
                            include: {
                                role: true
                            }
                        }
                    }
                },
                bids: {
                    include: {
                        Member: true
                    }
                }
            }
        });

        const number = leads.length

        // TODO: Calc totalLeads in which any member has given feedback based on member role
        const leadsWithFeedbackByRole = leads.reduce((acc: { [roleName: string]: number }, lead) => {
            lead.LeadFeedback.forEach((feedback: any) => {
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
            lead.LeadFeedback.forEach((feedback: any) => {
                if (feedback?.formName?.includes('Payment')) {
                    feedback?.feedback?.forEach((item: Feedbacks) => {
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
                LeadMember: {
                    some: { memberId: userId }
                }
            }
            : {
                LeadMember: {
                    some: { memberId: userId }
                }
            };

        // Fetch the leads with the constructed where clause
        const leads = await prisma.lead.findMany({
            where: whereClause,
            include: {
                Company: true,
                LeadMember: {
                    include: {
                        Member: true,
                    },
                },
                LeadFeedback: {
                    include: {
                        feedback: true,
                        member: {
                            include: {
                                role: true
                            }
                        }
                    }
                },
                Feedbacks: true,
                bids: {
                    include: {
                        Member: true
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
                LeadMember: {
                    include: {
                        Member: true
                    }
                },
                LeadFeedback: {
                    include: {
                        feedback: true,
                        member: {
                            include: {
                                role: true
                            }
                        }
                    }
                },
                bids: {
                    include: {
                        Member: true
                    }
                },
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        const leadsWithUniqueFeedback = leads.map(lead => {
            lead.LeadFeedback.forEach(feedbackEntry => {
                const feedbackMap = new Map<string, typeof feedbackEntry.feedback[0]>();

                feedbackEntry.feedback.forEach(item => {
                    const key = `${item.name}-${item.fieldType}`;
                    feedbackMap.set(key, item);  // Override if key already exists
                });

                feedbackEntry.feedback = Array.from(feedbackMap.values());
            });

            return lead;
        });


        const groupedLeads = leads.reduce((groups: any[], lead) => {
            lead.LeadFeedback.forEach((feedback: any) => {
                let group = groups.find(g => g.formName === feedback.formName);
                if (!group) {
                    group = {
                        formName: feedback.formName,
                        feedback: [],
                    };
                    groups.push(group);
                }
                group.feedback.push(...feedback.feedback);
            });
            return groups;
        }, []);

        return {
            lead: leadsWithUniqueFeedback,
            groupedLeads,
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
                Company: {
                    include: {
                        Depts: {
                            include: {
                                companyDeptForms: {
                                    include: {
                                        subDeptFields: true
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
                Company: true,
                LeadMember: {
                    include: {
                        Member: true
                    }
                },
                LeadFeedback: {
                    include: {
                        feedback: true,
                        member: {
                            include: {
                                role: true
                            }
                        }
                    }
                },
                bids: {
                    include: {
                        Member: true
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
                LeadTransferTo: {
                    some: {
                        transferById: userId,
                    },
                },
            },
            include: {
                LeadTransferTo: {
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

const createProspect = async (lead: z.infer<typeof createLeadSchema>) => {
    try {
        const company = await prisma.company.findFirst({
            where: { id: lead.companyId },
        });

        if (!company) {
            throw new Error("Company not found");
        }

        const isProspectExists = await prisma.prospect.findFirst({
            where: {
                OR: [
                    { email: lead.email },
                    { phone: lead.phone },
                ]
            },
        });

        if (isProspectExists) {
            throw new Error("Prospect already exists with the same email or phone number");
        }

        const companyManager = await prisma.member.findFirst({
            where: {
                id: company.companyManagerId,
                companyId: lead.companyId,
            },
        });

        if (!companyManager) {
            throw new Error("Company manager not found");
        }

        const formattedVehicleDate = lead.vehicleDate
            ? formatISO(parse(lead.vehicleDate, 'dd-MM-yyyy', new Date()))
            : null;

        const newLead = await prisma.prospect.create({
            data: {
                Company: {
                    connect: { id: lead.companyId },
                },
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                alternatePhone: lead.alternatePhone,
                address: lead.address,
                city: lead.city,
                state: lead.state,
                zip: lead.zip,
                rating: lead.rating,
                callStatus: CallStatus.PENDING, // or PENDING
                paymentStatus: PaymentStatus.PENDING, // or PENDING
                dynamicFieldValues: lead.dynamicFieldValues
            },
        });

        return { lead: newLead, errors: [] };
    } catch (error: any) {
        logger.error('Error creating lead:', error);
        throw new Error(`Error creating lead: ${error.message}`);
    }
};

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
                address: lead.address,
                city: lead.city,
                state: lead.state,
                zip: lead.zip,
                rating: lead.rating,
                vehicleDate: formatISO(parse(lead.vehicleDate || "", 'dd/MM/yyyy', new Date())),
                vehicleName: lead.vehicleName,
                vehicleModel: lead.vehicleModel,
                nextFollowUpDate: lead.nextFollowUpDate,
            },
        });

        return updatedLead;
    } catch (error: any) {
        logger.error('Error updating Lead:', error);
        throw new Error(`Error updating Lead: ${error.message}`);
    }
}

const approveLead = async (leadId: string, status: boolean) => {
    const prospect = await prisma.prospect.update({
        where: {
            id: leadId
        },
        data: {
            isLeadConverted: true,
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
            address: prospect.address,
            city: prospect.city,
            state: prospect.state,
            zip: prospect.zip,
            rating: prospect.rating,
            companyId: prospect.companyId,
            isLeadApproved: true,
        },
        update : { 
            name: prospect.name,
            email: prospect.email,
            phone: prospect.phone,
            alternatePhone: prospect.alternatePhone,
            address: prospect.address,
            city: prospect.city,
            state: prospect.state,
            zip: prospect.zip,
            rating: prospect.rating,
            companyId: prospect.companyId,
            isLeadApproved: true,
            // Follow up add krna baki h abhi !!!
        }
    })

    await prisma.leadMember.create({
        data: {
            leadId: prospectToLead.id,
            memberId: companyOwner.id,
        },
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

        // Upsert LeadMember entries
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

        // Fetch updated leads with their LeadStatus and LeadMembers
        const updatedLeadsWithRelations = await prisma.lead.findMany({
            where: {
                id: {
                    in: leadIds,
                },
            },
            include: {
                LeadMember: {
                    include: {
                        Member: true,
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
                LeadFeedback: true
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
                leadData: lead.LeadFeedback,
                transferToId,
                transferById: user.id,
            },
        });

        const updatedLead = await prisma.lead.update({
            where: {
                id: leadId,
            },
            data: {
                LeadMember: {
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

const submitFeedback = async ({ deptId, leadId, callStatus, paymentStatus, feedback, urls, submitType, formName, nextFollowUpDate }: z.infer<typeof submitFeedbackSchema>, userId: string) => {
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
                nextFollowUpDate
            }
        });

        if (!lead) {
            throw new Error("Lead not found")
        }

        const feedbackData = feedback.map(fb => ({
            name: fb.name,
            value: fb.value,
            fieldType: fb.fieldType,
            leadId: leadId,

        }));

        // Upsert lead feedback
        const newFeedback = await prisma.leadFeedback.upsert({
            where: {
                formName_leadId_memberId: {
                    formName,
                    leadId: leadId,
                    memberId: userId,
                },
            },
            update: {
                feedback: {
                    deleteMany: {
                        AND: feedbackData.map((fb) => ({
                            name: fb.name,
                        })),
                    },
                    createMany: {
                        data: feedbackData,
                    },
                },
                formName: formName,
                imageUrls: urls
            },
            create: {
                formName: formName,
                feedback: {
                    createMany: {
                        data: feedbackData,
                    },
                },
                imageUrls: urls,
                dept: {
                    connect: { id: dept.id },
                },
                lead: {
                    connect: { id: leadId },
                },
                member: {
                    connect: { id: userId },
                },
            },
            include: {
                feedback: true,
            },
        });

        if (submitType === leadUtils.SUBMIT_TO_MANAGER) {
            const updatedLead = await prisma.lead.update({
                where: {
                    id: leadId,
                },
                data: {
                    LeadMember: {
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
                Member: { connect: { id: userId } },
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
            Member: true,
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
                isFinancedApproved: financeStatus,
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

        const updatedLeadMember = await prisma.leadMember.create({
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

const updateLeadFollowUpDate = async (leadId: string, nextFollowUpDate: string, remark: string, customerResponse: string, rating: string, memberId: string) => {
    try {
        const updatedLead = await prisma.lead.update({
            where: {
                id: leadId,
            },
            data: {
                nextFollowUpDate: nextFollowUpDate,
                followUps: {
                    create: {
                        nextFollowUpDate: nextFollowUpDate,
                        followUpBy: {
                            connect: {
                                id: memberId,
                            },
                        },
                        remark,
                        customerResponse,
                        rating,
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
        const followUps = await prisma.followUp.findMany({
            where: {
                leadId,
            },
            include: {
                followUpBy: true,
            },
        });

        return followUps;
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
                        LeadFeedback: {
                            some: { formName: "Exchange" }
                        }
                    }
                ]
            },
            include: {
                LeadFeedback: {
                    where: { formName: "Exchange" },
                    include: {
                        member: true,
                        feedback: true
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
                LeadFeedback: {
                    some: {
                        feedback: {
                            some: {
                                fieldType: "DD_IMG"
                            }
                        }
                    }
                }
            },
            select: {
                LeadFeedback: {
                    where: {
                        feedback: {
                            some: {
                                fieldType: "DD_IMG"
                            }
                        }
                    },
                    include: {
                        feedback: {
                            where: {
                                fieldType: "DD_IMG"
                            }
                        }
                    }
                }
            }
        });
        console.log(JSON.stringify(leads, null, 2), "leads-----")
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
                LeadFeedback: {
                    some: {
                        formName: "Exchange",
                        feedback: {
                            some: {
                                fieldType: "IMAGE"
                            }
                        }
                    }
                }
            },
            select: {
                LeadFeedback: {
                    where: {
                        formName: "Exchange",
                        feedback: {
                            some: {
                                fieldType: "IMAGE"
                            }
                        }
                    },
                    include: {
                        member: true,
                        feedback: {
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

const paymentList = async (companyId: string) => {
    try {
        const leads = await prisma.lead.findMany({
            where: {
                companyId,
                LeadFeedback: {
                    some: { formName: { in: ["Payments"] } }
                }
            },
            select: {
                LeadFeedback: {
                    where: { formName: { in: ["Payments"] } },
                    include: {
                        member: true,
                        feedback: true
                    }
                }
            }
        })
        return formatReturnOfDB(leads as any)
    } catch (error: any) {
        logger.error('Error paymentList:', error);
        throw new Error(`Error paymentList: ${error.message}`);
    }
}

export default {
    getAllLeads,
    getLeadBids,
    getCompanyLeads,
    getCompanyProspects,
    getCompanyLeadById,
    getAssignedLeads,
    createProspect,
    updateLead,
    approveLead,
    leadAssignTo,
    submitFeedback,
    submitBid,
    updateLeadFinanceStatus,
    getLeadsByDateRange,
    updateLeadFollowUpDate,
    leadTransferTo,
    getTransferedLeads,
    updateLeadPaymentStatus,
    getFollowUpByLeadId,
    getAllProspects,
    xChangerCustomerList,
    getLeadPhotos,
    paymentList,
    getExchangeLeadImgs
}