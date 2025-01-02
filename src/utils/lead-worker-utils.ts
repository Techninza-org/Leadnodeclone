import { FormValue, Lead, SubmittedForm } from "@prisma/client";
import prisma from "../config/database";

type formatReturnOfDBType = Lead & {
    submittedForm: SubmittedForm & {
        formValue: FormValue[]
    }[]
}

export function getColumnNames(data: any[]) {
    const columnNames = new Set();
    const dependentCols = new Set();

    data.forEach(item => {
        item.formValue.forEach((formItem: any) => {
            return formItem.name && columnNames.add(formItem.name);
        });
        item.dependentOnValue.forEach((formItem: any) => {
            return formItem.name && dependentCols.add(formItem.name);
        })
    });
    return { columnNames: Array.from(columnNames), dependentCols: Array.from(dependentCols) };
}

export const formatReturnOfDB = (formData: any[]) => {
    const cols = getColumnNames(formData);
    const rows = formData.map((lead) => {
        const row: any = {};
        row.dependentValue = {};
        lead.formValue.forEach((item: any) => {
            row.createdAt = item.createdAt;

            // Might need to change handle for dependent fieldTypes
            row[item.name] = item.value;
            // if (item.fieldType === "IMAGE") {
            //     row[item.name] = item.value;
            // }
            // if (item.fieldType === "DD_IMG") {
            //     row[item.name] = item.value;
            // }
            // else if (item.fieldType === "INPUT") {
            //     row[item.name] = item.value;
            // }
        });

        lead.dependentOnValue.forEach((item: any) => {
            row.dependentValue.createdAt = item.createdAt;

            // Might need to change handle for dependent fieldTypes
            row.dependentValue[item.name] = item.value;
            // if (item.fieldType === "IMAGE") {
            //     row[item.name] = item.value;
            // }
            // if (item.fieldType === "DD_IMG") {
            //     row[item.name] = item.value;
            // }
            // else if (item.fieldType === "INPUT") {
            //     row[item.name] = item.value;
            // }
        });
        return row;
    });
    return {
        cols,
        rows
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
                    }
                },
            },
        })
    } catch (err) {
        console.log(err)
    }
}
