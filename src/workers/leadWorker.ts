import { z } from "zod";
import { formatISO, parse } from "date-fns";
import { CallStatus, PaymentStatus } from "@prisma/client";
import prisma from "../config/database";
import logger from "../utils/logger";
import { createLeadSchema, leadAssignToSchema, leadBidSchema, submitFeedbackSchema } from "../types/lead";

const getAllLeads = async () => {
    try {
        const leads = await prisma.lead.findMany({
            include: {
                Company: true,
                LeadStatus: {
                    include: {
                        Dept: true,
                    }
                },
            },
        });

        return leads;
    } catch (error) {
        logger.error('Error fetching Leads:', error);
        return [];
    }
}

const getAssignedLeads = async (userId: string, companyId: string) => {
    try {
        let leads;
        if (!!companyId) {
            leads = await prisma.lead.findMany({
                where: {
                    companyId,
                    LeadStatus: {
                        every: {
                            assignedToId: userId,
                        }
                    },
                },
                include: {
                    Company: true,
                    LeadStatus: {
                        include: {
                            Dept: true,
                        },
                    },
                },
            });
        } else {
            leads = await prisma.lead.findMany({
                where: {
                    LeadStatus: {
                        every: {
                            assignedToId: userId,
                        }
                    },
                },
                include: {
                    Company: true,
                    LeadStatus: {
                        include: {
                            Dept: true,
                        },
                    },
                },
            });
        }

        return leads;
    } catch (error) {
        logger.error('Error fetching Leads:', error);
        return [];
    }
}


const getCompanyLeads = async (companyId: string) => {
    try {
        const leads = await prisma.lead.findMany({
            where: {
                companyId,
            },
            include: {
                Company: true,
                LeadStatus: {
                    include: {
                        Dept: true,
                        assignedTo: true
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        return leads;
    } catch (error) {
        logger.error('Error fetching Leads:', error);
        return [];
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
                LeadStatus: {
                    include: {
                        Dept: true,
                    },
                },
            },
        });

        return lead;
    } catch (error) {
        logger.error('Error fetching Leads:', error);
        return null;
    }
}

const createLead = async (lead: z.infer<typeof createLeadSchema>) => {

    try {

        const company = await prisma.company.findFirst({
            where: {
                id: lead.companyId,
            },
        });

        if (!company) {
            throw new Error("Company not found")
        }

        const companyManager = await prisma.member.findFirst({
            where: {
                id: company.companyManagerId,
                companyId: lead.companyId,
            },
        });


        if (!companyManager) {
            throw new Error("Company manager not found")
        }

        let newLead = null;
        newLead = await prisma.lead.create({
            data: {
                Company: {
                    connect: {
                        id: lead.companyId,
                    },
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
                vehicleDate: formatISO(parse(lead.vehicleDate || "", 'dd/MM/yyyy', new Date())),
                vehicleName: lead.vehicleName,
                vehicleModel: lead.vehicleModel,
                callStatus: CallStatus.PENDING,
                paymentStatus: PaymentStatus.PENDING,
                LeadStatus: {
                    create: {
                        name: "New Lead",
                        description: "description",

                    },
                },
            },
        });

        return { lead: newLead, errors: [] };
    } catch (error: any) {
        logger.error('Error creating Lead:', error);
        throw new Error(`Error creating lead: ${error.message}`)
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
                address: lead.address,
                city: lead.city,
                state: lead.state,
                zip: lead.zip,
                rating: lead.rating,
                vehicleDate: formatISO(parse(lead.vehicleDate || "", 'dd/MM/yyyy', new Date())),
                vehicleName: lead.vehicleName,
                vehicleModel: lead.vehicleModel,
            },
        });

        return updatedLead;
    } catch (error: any) {
        logger.error('Error updating Lead:', error);
        throw new Error(`Error updating Lead: ${error.message}`);
    }
}

const leadAssignTo = async ({ companyId, leadIds, deptId, userId, description }: z.infer<typeof leadAssignToSchema>) => {
    try {
        if (!Array.isArray(leadIds)) {
            throw new Error("leadIds must be an array of lead IDs");
        }

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

        const member = await prisma.member.findFirst({
            where: {
                companyId,
                deptId,
                id: userId,
            },
        });

        if (!member) {
            throw new Error("Member not found, Member must be part of the Company and respective Department");
        }

        const updatedLeads = await prisma.leadStatus.updateMany({
            where: {
                leadId: {
                    in: leadIds,
                },
            },
            data: {
                name: `Assigned to ${member.name}`,
                description,
                deptId: member.deptId,
                assignedToId: userId,
            },
        });

        const updatedLeadsWithRelations = await prisma.lead.findMany({
            where: {
                id: {
                    in: leadIds,
                },
            },
            include: {
                LeadStatus: {
                    include: {
                        assignedTo: true,
                        Dept: true,
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

const submitFeedback = async ({ deptId, leadId, callStatus, paymentStatus, feedback, urls }: z.infer<typeof submitFeedbackSchema>, userId: string) => {
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
                paymentStatus
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
                leadId_memberId: {
                    leadId: leadId,
                    memberId: userId,
                },
            },
            update: {
                feedback: {
                    deleteMany: {}, // Clear existing feedbacks to avoid duplicates
                    createMany: {
                        data: feedbackData,
                    },
                },
                imageUrls: urls
            },
            create: {
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

        const updatedLeadStatus = await prisma.leadStatus.update({
            where: {
                leadId,
            },
            data: {
                assignedToId: company.companyManagerId
            },
        });

        return { lead: lead, message: "Updated Successfully!", errors: [] };
    } catch (error: any) {
        logger.error('Error updating Lead:', error);
        throw new Error(`Error Submitting Lead Feedback: ${error.message}`);
    }
}

const submitBid = async ({ deptId, leadId, companyId, bidAmount, description }: z.infer<typeof leadBidSchema>, userId: string) => {

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
            id: companyId,
        },
    });

    if (!company) {
        throw new Error("Company not found")
    }

    const member = await prisma.member.findFirst({
        where: {
            id: userId,
            companyId,
        },
    });

    if (!member) {
        throw new Error("Member not found")
    }

    const lead = await prisma.lead.findFirst({
        where: {
            id: leadId,
            companyId,
        },
    });

    if (!lead) {
        throw new Error("Lead not found")
    }

    const newBid = await prisma.bid.upsert({
        where: {
            leadId,
        },
        update: {
            bidAmount: parseFloat(bidAmount),
            description,
        },
        create: {
            bidAmount: parseFloat(bidAmount),
            description,
            lead: {
                connect: { id: leadId },
            },
            Member: {
                connect: { id: userId },
            },
        },
    })

    console.log(newBid)

    return newBid;
}

export const getLeadBids = async (leadId: string) => {
    console.log("leadId", leadId)
    const bids = await prisma.bid.findMany({
        where: {
            leadId,
        },
        include: {
            Member: true,
        },
    });

    console.log("bids", bids)
    return bids;
}


export default {
    getAllLeads,
    getLeadBids,
    getCompanyLeads,
    getCompanyLeadById,
    getAssignedLeads,
    createLead,
    updateLead,
    leadAssignTo,
    submitFeedback,
    submitBid
}