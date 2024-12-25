import { FormValue, Lead, SubmittedForm } from "@prisma/client";
import prisma from "../config/database";

type formatReturnOfDBType = Lead & {
    submittedForm: SubmittedForm & {
        formValue: FormValue[]
    }[]
}

export const formatReturnOfDB = (leads: formatReturnOfDBType[]) => {
    const rows = leads.map((lead) => {
        const row: any = {};
        lead.submittedForm.forEach((feedback) => {
            feedback.formValue.forEach((item) => {
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

export const followUpUpdater = async (leadId: string, desc: string, userName: string) => {
    let lead: any; 
    try {
        const lead = await prisma.lead.update({
            where: {
                id: leadId
            },
            data: {
                followUps: {
                    create: {
                        followUpBy: userName,
                        remark: desc,
                    }
                },
            },
        })
    } catch (err) {
        console.log(err)
    }
    
    try {
        const prospect = await prisma.prospect.update({
            where: {
                id: leadId
            },
            data: {
                followUps: {
                    create: {
                        followUpBy: userName,
                        remark: desc,
                        leadId: lead && lead.id,
                    }
                },
            },
        })
    } catch (err) {
        console.log(err)
    }
}
