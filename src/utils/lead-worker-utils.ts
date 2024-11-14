import { Feedbacks, Lead, LeadFeedback } from "@prisma/client";

type formatReturnOfDBType = Lead & {
    LeadFeedback: LeadFeedback & {
        feedback: Feedbacks[]
    }[]
}

export const formatReturnOfDB = (leads: formatReturnOfDBType[]) => {
    const rows = leads.map((lead) => {
        const row: any = {};
        lead.LeadFeedback.forEach((feedback) => {
            feedback.feedback.forEach((item) => {
                row.name = lead.name;
                row.createdAt = item.createdAt;
                if (item.fieldType === "IMAGE") {
                    row[item.name] = item.value;
                }
                if (item.fieldType === "DD_IMG") {
                    row[item.name] = item.value;
                }
                 else if (item.fieldType === "INPUT") {
                    row[item.name] = item.value;
                }
            });
        });
        return row;
    });
    return {
        data: {
            rows
        }
    }
} 