import { z } from "zod";
import { formatISO, parse } from "date-fns";
import { CallStatus, PaymentStatus } from "@prisma/client";
import prisma from "../config/database";
import logger from "../utils/logger";
import { createLeadSchema, leadAssignToSchema, submitFeedbackSchema } from "../types/lead";

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
                    },
                },
            },
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
            return { lead: null, errors: [{ message: 'Company not found', path: [] }] };
        }

        const companyManager = await prisma.member.findFirst({
            where: {
                id: company.companyManagerId,
                companyId: lead.companyId,
            },
        });

        console.log(companyManager, "companyManager")


        if (!companyManager) {
            return { lead: null, errors: [{ message: 'Company manager not found', path: [] }] };
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
                LeadStatus: {
                    create: {
                        name: "New Lead",
                        description: "description",
                        callStatus: CallStatus.PENDING,
                        paymentStatus: PaymentStatus.PENDING,
                    },
                },
            },
        });

        return { lead: newLead, errors: [] };
    } catch (error) {
        logger.error('Error creating Lead:', error);
        return { lead: null, errors: [{ message: 'Error creating lead', path: [] }] };
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
    } catch (error) {
        logger.error('Error updating Lead:', error);
        return { lead: null, errors: [{ message: 'Error updating lead', path: [] }] };
    }
}

const leadAssignTo = async ({ companyId, leadId, deptId, userId, description }: z.infer<typeof leadAssignToSchema>) => {
    try {
        const lead = await prisma.lead.findFirst({
            where: {
                companyId,
                id: leadId,
            },
        });

        if (!lead) {
            return { lead: null, errors: [{ message: 'Lead not found', path: [] }] };
        }

        const member = await prisma.member.findFirst({
            where: {
                companyId,
                deptId,
                id: userId,
            },
        });

        if (!member) {
            return { lead: null, errors: [{ message: 'Member not found, Member must the part of Company and respective Department!', path: [] }] };
        }


        const updatedLeadStatus = await prisma.leadStatus.updateMany({
            where: {
                leadId,
            },
            data: {
                name: `Assigned to ${member.name}`,
                description,
                deptId: member.deptId,
                assignedToId: userId,
                callStatus: CallStatus.PENDING,
                paymentStatus: PaymentStatus.PENDING,
            },
        });

        if (updatedLeadStatus.count === 0) {
            return { lead: null, errors: [{ message: 'LeadStatus not found or not updated', path: [] }] };
        }

        console.log(updatedLeadStatus, "updatedLeadStatus")

        return { lead: updatedLeadStatus, error: [] };
    } catch (error) {
        logger.error('Error assigning Lead:', error);
        return { lead: null, errors: [{ message: 'Error assigning lead', path: [] }] };
    }
}

const submitFeedback = async ({ deptId, leadId, feedback }: z.infer<typeof submitFeedbackSchema>) => {
    try {

        const dept = await prisma.dept.findFirst({
            where: {
                id: deptId,
            },
        });

        if (!dept) {
            return { lead: null, errors: [{ message: 'Department not found', path: [] }] };
        }

        const company = await prisma.company.findFirst({
            where: {
                id: dept.companyId || "",
            },
        });

        if (!company) {
            return { lead: null, errors: [{ message: 'Company not found', path: [] }] };
        }

        const lead = await prisma.lead.findFirst({
            where: {
                id: leadId,
            },
        });

        if (!lead) {
            return { lead: null, errors: [{ message: 'Lead not found', path: [] }] };
        }

        const newFeedback = await prisma.leadFeedback.upsert({
            where: {
                leadId: leadId,
            },
            update: {
                feedback,
            },
            create: {
                feedback,
                dept: {
                    connect: {
                        id: dept.id,
                    },
                },
                lead: {
                    connect: {
                        id: leadId,
                    },
                },
            },
        });


        const updatedLeadStatus = await prisma.leadStatus.updateMany({
            where: {
                leadId,
            },
            data: {
                callStatus: CallStatus.SUCCESS,
                assignedToId: company.companyManagerId
            },
        });

        if (updatedLeadStatus.count === 0) {
            return { lead: null, errors: [{ message: 'LeadStatus not found or not updated', path: [] }] };
        }

        return { lead: null, message: "Updated Successfully!", errors: [] };
    } catch (error) {
        logger.error('Error updating Lead:', error);
        return { lead: null, errors: [{ message: 'Error Submitting Lead Feedback', path: [] }] };
    }
}

export default {
    getAllLeads,
    getCompanyLeads,
    getCompanyLeadById,
    createLead,
    updateLead,
    leadAssignTo,
    submitFeedback,
}