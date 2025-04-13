import { z, ZodIssue } from 'zod';
import leadWorker from '../workers/leadWorker';
import { createLeadSchema, leadAssignToSchema, leadBidSchema, submitFeedbackSchema } from '../types/lead';
import logger from '../utils/logger';
import { loggedUserSchema } from '../types/user';

export const leadResolvers = {
    getAllLeads: async () => {
        try {
            return await leadWorker.getAllLeads();
        } catch (error) {
            logger.error('Error fetching lead [getAllLeads]:', error);
            throw new Error('Error fetching lead');
        }
    },

    getLeadsByDateRange: async ({ companyId, startDate, endDate }: { companyId: string, startDate: string, endDate: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.getLeadsByDateRange(user.companyId, startDate, endDate);
        } catch (error) {
            logger.error('Error fetching lead [getLeadsByDateRange]:', error);
            throw new Error(`Error fetching lead ${error}`);
        }
    },

    getCompanyLeads: async ({ companyId }: { companyId: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.getCompanyLeads(companyId, user);
        } catch (error) {
            logger.error('Error fetching lead [getCompanyLeads]:', error);
            throw new Error('Error fetching lead');
        }
    },
    getLeadsByDeptId: async ({
        deptId,
        page,
        limit,
        fromDate,
        toDate,
        searchQuery
    }: {
        deptId: string,
        page: number,
        limit: number,
        fromDate?: string,
        toDate?: string,
        searchQuery?: string
    }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.getLeadsByDeptId(
                deptId,
                page,
                limit,
                fromDate,
                toDate,
                searchQuery
            );
        } catch (error) {
            console.log(error, "error")
            logger.error('Error fetching lead [getLeadsByDeptId]:', error);
            throw new Error('Error fetching lead');
        }
    },
    getCompanyProspects: async ({ companyId }: { companyId: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.getCompanyProspects(companyId, user);
        } catch (error) {
            logger.error('Error fetching lead [getCompanyProspects]:', error);
            throw new Error('Error fetching lead');
        }
    },

    getAssignedLeads: async ({ userId }: { userId: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.getAssignedLeads(userId, user?.companyId);
        } catch (error) {
            logger.error('Error fetching lead [getAssignedLeads]:', error);
            throw new Error('Error fetching lead');
        }
    },
    getAssignedProspect: async ({ userId }: { userId: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.getAssignedProspect(userId, user?.companyId);
        } catch (error) {
            logger.error('Error fetching lead [getAssignedProspect]:', error);
            throw new Error('Error fetching lead');
        }
    },
    getCompanyLeadById: async ({ companyId, leadId }: { companyId: string, leadId: string }) => {
        try {
            return await leadWorker.getCompanyLeadById(companyId, leadId);
        } catch (error) {
            logger.error('Error fetching lead [getCompanyLeadById]:', error);
            throw new Error('Error fetching lead');
        }
    },
    getTransferedLeads: async ({ userId }: { userId: string }) => {
        try {
            return await leadWorker.getTransferedLeads(userId);
        } catch (error) {
            logger.error('Error fetching lead [getTransferedLeads]:', error);
            throw new Error('Error fetching lead');
        }
    },
    createLead: async ({ input }: { input: z.infer<typeof createLeadSchema> }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            // const parsedData = createLeadSchema.safeParse(input);

            // if (!parsedData.success) {
            //     const errors = parsedData.error.errors.map((err: ZodIssue) => ({
            //         message: err.message,
            //         path: err.path,
            //     }));
            //     return { user: null, errors };
            // }
            return await leadWorker.createLead(input, user);
        } catch (error) {
            logger.error('Error Creating lead:', error);
            throw new Error('Error Creating lead');
        }
    },
    createProspect: async ({ input }: { input: z.infer<typeof createLeadSchema> }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.createProspect(input, user);
        } catch (error: any) {
            logger.error('Error Creating lead:', error);
            throw new Error(error);
        }
    },

    appvedLead: async ({ leadId, status }: { leadId: string, status: boolean }, { user }: { user: any }) => {
        try {
            return await leadWorker.approveLead(leadId, status, user.name);
        } catch (error) {
            logger.error('Error Approving lead:', error);
            throw new Error('Error Approving lead');
        }
    },
    leadToClient: async ({ leadId, status }: { leadId: string, status: boolean }, { user }: { user: any }) => {
        try {
            return await leadWorker.leadToClient(leadId, status, user.name);
        } catch (error) {
            logger.error('Error Approving lead:', error);
            throw new Error('Error Approving lead');
        }
    },
    getClients: async (_: any, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.getClients(user.companyId);
        } catch (error) {
            logger.error('Error fetching lead bids:', error);
            throw new Error('Error fetching lead bids');
        }
    },

    leadAssignTo: async ({ companyId, leadIds, deptId, userIds, description }: z.infer<typeof leadAssignToSchema>) => {
        try {
            // const parsedData = leadAssignToSchema.safeParse({ companyId, leadIds, deptId, userIds, description });
            // if (!parsedData.success) {
            //     const errors = parsedData.error.errors.map((err: ZodIssue) => ({
            //         message: err.message,
            //         path: err.path,
            //     }));
            //     return { user: null, errors };
            // }
            return await leadWorker.leadAssignTo({ companyId, leadIds, deptId, userIds, description });
        } catch (error) {
            logger.error('Error Assigning lead [leadAssignTo]:', error);
            throw new Error(`${error}`);
        }
    },
    prospectAssignTo: async ({ companyId, leadIds, deptId, userIds, description }: z.infer<typeof leadAssignToSchema>) => {
        try {
            // const parsedData = leadAssignToSchema.safeParse({ companyId, leadIds, deptId, userIds, description });
            // if (!parsedData.success) {
            //     const errors = parsedData.error.errors.map((err: ZodIssue) => ({
            //         message: err.message,
            //         path: err.path,
            //     }));
            //     return { user: null, errors };
            // }
            return await leadWorker.prospectAssignTo({ companyId, prospectIds: leadIds, deptId, userIds, description });
        } catch (error) {
            logger.error('Error Assigning lead [leadAssignTo]:', error);
            throw new Error(`${error}`);
        }
    },
    leadTransferTo: async ({ leadId, transferToId }: { leadId: string, transferToId: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.leadTransferTo({ leadId, transferToId }, { user });
        } catch (error) {
            logger.error('Error Assigning lead [leadAssignTo]:', error);
            throw new Error(`${error}`);
        }
    },

    submitFeedback: async ({ nextFollowUpDate, deptId, leadId, callStatus, paymentStatus, feedback, childFormValue, dependentOnFormName, urls, submitType, formName }: z.infer<typeof submitFeedbackSchema>, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            // const parsedData = submitFeedbackSchema.safeParse({ deptId, leadId, feedback });
            // if (!parsedData.success) {
            //     const errors = parsedData.error.errors.map((err: ZodIssue) => ([err.message, err.path]));
            //     throw new Error(errors.join(', '));
            // }
            return await leadWorker.submitFeedback({ nextFollowUpDate, deptId, leadId, callStatus, paymentStatus, feedback, dependentOnFormName, childFormValue, urls, submitType, formName }, user);
        } catch (error) {
            logger.error('Error Submitting Feedback:', error);
            throw new Error('Error Submitting Feedback');
        }
    },
    getLeadBids: async ({ leadId }: { leadId: string }) => {
        try {
            return await leadWorker.getLeadBids(leadId);
        } catch (error) {
            logger.error('Error fetching lead bids:', error);
            throw new Error('Error fetching lead bids');
        }
    },
    submitBid: async ({ deptId, leadId, companyId, bidAmount, description }: z.infer<typeof leadBidSchema>, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.submitBid({ deptId, leadId, companyId, bidAmount, description, memberId: user.id }, user.id);
        } catch (error) {
            logger.error('Error Submitting Bid:', error);
            throw new Error(`Error Submitting Bid ${error}`);
        }
    },
    updateLeadFinanceStatus: async ({ leadId, financeStatus }: { leadId: string, financeStatus: boolean }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.updateLeadFinanceStatus(leadId, financeStatus, user.id, user.companyId);
        } catch (error) {
            logger.error('Error updating lead finance status:', error);
            throw new Error(`Error updating lead finance status: ${error}`);
        }
    },
    updateLeadFollowUpDate: async ({ leadId, nextFollowUpDate, remark, feedback, customerResponse, rating }: { feedback: any, leadId: string, nextFollowUpDate: string, remark: string, customerResponse: string, rating: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.updateLeadFollowUpDate(feedback, leadId, nextFollowUpDate, remark, customerResponse, rating, user.name);
        } catch (error) {
            logger.error('Error updating lead follow up date:', error);
            throw new Error(`Error updating lead follow up date: ${error}`);
        }
    },
    updateProspectFollowUpDate: async ({ leadId, nextFollowUpDate, remark, feedback, customerResponse, rating }: { feedback: any, leadId: string, nextFollowUpDate: string, remark: string, customerResponse: string, rating: string }, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.updateProspectFollowUpDate(feedback, leadId, nextFollowUpDate, remark, customerResponse, rating, user.name);
        } catch (error) {
            logger.error('Error updating lead follow up date:', error);
            throw new Error(`Error updating lead follow up date: ${error}`);
        }
    },
    updateLeadPaymentStatus: async ({ leadId, paymentStatus }: { leadId: string, paymentStatus: string }) => {
        try {
            return await leadWorker.updateLeadPaymentStatus(leadId, paymentStatus);
        } catch (error) {
            logger.error('Error updating lead payment status:', error);
            throw new Error(`Error updating lead payment status: ${error}`);
        }
    },
    getFollowUpByLeadId: async ({ leadId }: { leadId: string }) => {
        try {
            return await leadWorker.getFollowUpByLeadId(leadId);
        } catch (error) {
            logger.error('Error fetching follow up:', error);
            throw new Error(`Error fetching follow up: ${error}`);
        }
    },
    xChangerCustomerList: async (_: any, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.xChangerCustomerList(user.companyId);
        } catch (error) {
            logger.error('Error fetching follow up:', error);
            throw new Error(`Error fetching follow up: ${error}`);
        }
    },
    getLeadPhotos: async (_: any, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.getLeadPhotos(user.companyId);
        } catch (error) {
            logger.error('Error fetching follow up:', error);
            throw new Error(`Error fetching follow up: ${error}`);
        }
    },
    getExchangeLeadImgs: async (_: any, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.getExchangeLeadImgs(user.companyId);
        } catch (error) {
            logger.error('Error fetching follow up:', error);
            throw new Error(`Error fetching follow up: ${error}`);
        }
    },
    getFormValuesByFormName: async ({ formName }: any, { user }: { user: z.infer<typeof loggedUserSchema> }) => {
        try {
            return await leadWorker.getFormValuesByFormName(user.companyId, formName);
        } catch (error) {
            logger.error('Error fetching follow up:', error);
            throw new Error(`Error fetching follow up: ${error}`);
        }
    },
    editLeadFormValue: async ({ submittedFormId, formValue }: { submittedFormId: string, formValue: any }) => {
        try {
            return await leadWorker.editLeadFormValue(submittedFormId, formValue);
        } catch (error) {
            logger.error('Error fetching follow up:', error);
            throw new Error(`Error fetching follow up: ${error}`);

        }
    },
    deleteLead: async ({ leadId }: { leadId: string }) => {
        try {
            return await leadWorker.deleteLead(leadId);
        } catch (error) {
            logger.error('Error deleting lead:', error);
            throw new Error(`Error deleting lead: ${error}`);
        }
    }

};