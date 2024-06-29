
import { z, ZodIssue } from 'zod';
import leadWorker from '../workers/leadWorker';
import { createLeadSchema, leadAssignToSchema, submitFeedbackSchema } from '../types/lead';
import logger from '../utils/logger';

export const leadResolvers = {
    getAllLeads: async () => {
        try {
            return await leadWorker.getAllLeads();
        } catch (error) {
            logger.error('Error fetching lead [getAllLeads]:', error);
            throw new Error('Error fetching lead');
        }
    },

    getCompanyLeads: async ({ companyId }: { companyId: string }) => {
        try {
            return await leadWorker.getCompanyLeads(companyId);
        } catch (error) {
            logger.error('Error fetching lead [getCompanyLeads]:', error);
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

    createLead: async ({ input }: { input: z.infer<typeof createLeadSchema> }) => {
        try {
            const parsedData = createLeadSchema.safeParse(input);

            if (!parsedData.success) {
                const errors = parsedData.error.errors.map((err: ZodIssue) => ({
                    message: err.message,
                    path: err.path,
                }));
                return { user: null, errors };
            }

            return await leadWorker.createLead(parsedData.data);
        } catch (error) {
            logger.error('Error Creating lead:', error);
            throw new Error('Error Creating lead');
        }
    },

    leadAssignTo: async ({ companyId, leadId, deptId, userId, description }: z.infer<typeof leadAssignToSchema>) => {
        try {
            const parsedData = leadAssignToSchema.safeParse({ companyId, leadId, deptId, userId, description });
            if (!parsedData.success) {
                const errors = parsedData.error.errors.map((err: ZodIssue) => ({
                    message: err.message,
                    path: err.path,
                }));
                return { user: null, errors };
            }
            return await leadWorker.leadAssignTo({ companyId, leadId, deptId, userId, description });
        } catch (error) {
            logger.error('Error Assigning lead [leadAssignTo]:', error);
            throw new Error('Error fetching lead');
        }
    },

    submitFeedback: async ({ deptId, leadId, feedback }: z.infer<typeof submitFeedbackSchema>) => {
        try {
            const parsedData = submitFeedbackSchema.safeParse({ deptId, leadId, feedback });
            if (!parsedData.success) {
                const errors = parsedData.error.errors.map((err: ZodIssue) => ({
                    message: err.message,
                    path: err.path,
                }));
                return { user: null, errors };
            }
            return await leadWorker.submitFeedback({ deptId, leadId, feedback });
        } catch (error) {
            logger.error('Error Submitting Feedback:', error);
            throw new Error('Error Submitting Feedback');
        }
    }
}