import { ExtendedRequest } from "../middleware/authMiddleware";
import { Response } from 'express';
import userWorker from "../workers/userWorker";
import prisma from "../config/database";
import exceljs from "exceljs";
import csvtojson from "csvtojson";
import { validateLeadCSV } from "../utils/validator";
import { format, parse } from "date-fns";
import { createLeadSchema } from "../types/lead";
import { z } from "zod";
import logger from "../utils/logger";

export const uploadImage = (req: ExtendedRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files) {
        return res.status(400).send('No file uploaded.');
    }
    const fileInfos = files.map(file => ({
        fieldname: file.fieldname, // Capturing the original field name
        url: `${req.protocol}://${req.get('host')}/graphql/images/${file.filename
            .replace(/between/gi, "") // Remove "between" in any case
            .replace(/\s+/g, "")      // Remove any spaces left in the filename
            }`
    }));

    console.log(fileInfos)

    return res.status(200).json({ files: fileInfos });
};

export const broadcastMessage = async (req: ExtendedRequest, res: Response) => {
    const user = req.user;
    const { id, subCategory, option, value, desc } = req.body;


    if (!subCategory) {
        return res.status(400).json({ error: 'ID or subCategory are required fields.' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    const fileInfos = files.map(file => ({
        fieldname: file.fieldname,
        url: `${req.protocol}://${req.get('host')}/graphql/images/${file.filename
            .replace(/between/gi, "") // Remove "between" in any case
            .replace(/\s+/g, "")      // Remove any spaces left in the filename
            }`
    }));

    console.log(fileInfos)

    try {
        const update = await userWorker.createNUpdateBroadcast({
            id,
            subCategory,
            option,
            desc,
            valueId: value,
            imgURL: fileInfos,
            companyId: user?.companyId,
        });

        return res.status(200).json({ update });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to update broadcast message.', details: error.message });
    }
};

export const bulkUploadLead = async (req: ExtendedRequest, res: Response) => {

    const user = req.user;
    if (!req.file || !req.file.buffer) {
        return res.status(400).send({ valid: false, message: "No file uploaded" });
    }

    const json = await csvtojson().fromString(req.file.buffer.toString('utf8'));

    const csvLeads = json.map((lead: any) => {
        let formattedVehicleDate = null;
        if (lead["Vehicle Date"]) {
            const parsedDate = parse(lead["Vehicle Date"], 'dd-MM-yyyy', new Date());
            formattedVehicleDate = format(parsedDate, 'yyyy-MM-dd');
        }

        return {
            name: lead["Name"],
            email: lead["Email"],
            phone: lead["Phone"],
            address: lead["Address"],
            city: lead["City"],
            zip: lead["Zip"],
            state: lead["State"],
            vehicleName: lead["Vehicle Name"],
            vehicleModel: lead["Vehicle Model"],
            vehicleDate: formattedVehicleDate ? `${formattedVehicleDate}T00:00:00.000Z` : null,
            callStatus: lead["Call Status"] || "PENDING",
            paymentStatus: lead["Payment Status"] || "PENDING",
            companyId: user?.companyId,
            isFinancedApproved: false,
        };
    });

    const leads = csvLeads.filter((lead: any) => lead.email && lead.phone);

    if (leads.length < 1) {
        return res.status(200).send({ valid: false, message: "empty payload" });
    }

    try {
        const errorWorkbook = new exceljs.Workbook();
        const errorWorksheet = errorWorkbook.addWorksheet('Error Sheet');

        errorWorksheet.columns = [
            { header: 'Email', key: 'email', width: 20 },
            { header: 'Phone', key: 'phone', width: 20 },
            { header: 'Error Message', key: 'errors', width: 40 },
        ];

        const errorRows: any = [];
        leads.forEach((lead) => {
            const errors: string[] = [];
            Object.entries(lead).forEach(([fieldName, value]) => {
                const error = validateLeadCSV(value, fieldName);
                if (error) {
                    errors.push(error);
                }
            });

            if (errors.length > 0) {
                errorRows.push({ email: lead.email, phone: lead.phone, errors: errors.join(", ") });
            }
        });

        if (errorRows.length > 0) {
            errorWorksheet.addRows(errorRows);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=error_report.csv');

            await errorWorkbook.csv.write(res);
            return res.end();
        }

        const createdLeads = await prisma.lead.createMany({ data: leads });

        return res.status(200).json({ valid: true, message: "Leads uploaded successfully", createdLeads });

    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to upload lead.', details: error.message });
    }
};

const validateProspect = (data: any) => {
    try {
        createLeadSchema.parse(data);
        return null; // No error
    } catch (error: any) {
        return error.errors.map((e: any) => e.message).join(", ");
    }
};

const createBulkProspect = async (leads: z.infer<typeof createLeadSchema>[], companyId: string) => {
    try {
        const errorWorkbook = new exceljs.Workbook();
        const errorWorksheet = errorWorkbook.addWorksheet('Error Sheet');

        errorWorksheet.columns = [
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Error Message', key: 'errors', width: 50 },
        ];

        const errorRows: any[] = [];
        const validLeads: any[] = [];

        for (const lead of leads) {
            const errors: string[] = [];

            // Validation for each field (add more validation as needed)
            // if (!lead.name) errors.push('Name is required');
            // if (!lead.email || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(lead.email)) {
            //     errors.push('Invalid email address');
            // }
            // if (!lead.phone) errors.push('Phone number is required');
            // if (!lead.city) errors.push('City is required');

            // Here you can add more custom validation logic if necessary

            // console.log(errors, "errors")
            // if (errors.length > 0) {
            //     errorRows.push({ email: lead.email, errors: errors.join(', ') });
            // } else {
            // If no errors, prepare the lead for saving
            if (lead.name.length > 3) {
                validLeads.push({
                    companyId,
                    name: lead.name,
                    email: lead.email,
                    phone: String(lead.phone),
                    alternatePhone: lead.alternatePhone,
                    address: lead.address,
                    city: String(lead.city),
                    state: lead.state,
                    zip: lead.zip,
                    rating: lead.rating,
                    callStatus: 'PENDING', // or some default value
                    paymentStatus: 'PENDING', // or some default value
                    dynamicFieldValues: lead.dynamicFieldValues
                });
            }

            // }
        }

        // if (errorRows.length > 0) {
        //     errorWorksheet.addRows(errorRows);
        //     return { valid: false, message: 'Validation errors found', errorReport: errorWorkbook };
        // }


        // If no errors, save valid leads to the database
        const createdLeads = await prisma.prospect.createMany({
            data: validLeads,
        });

        return { valid: true, message: 'Leads created successfully', leads: {} };
    } catch (error: any) {
        logger.error('Error creating leads:', error);
        throw new Error(`Error creating leads: ${error.message}`);
    }
};


export const handleCreateBulkProspect = async (req: ExtendedRequest, res: Response) => {
    const body = await req.body;
    console.log(body, "body")

    // @ts-ignore
    const result = await createBulkProspect(body, req.user.companyId);
    console.log(result, "result")

    if (!result.valid) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=error_report.csv');
        // await result?.errorReport?.xlsx.write(res);
        return res.end();
    }

    // Return a response with the result (assuming valid data in the future)
    return res.status(200).json({ message: 'Leads processed successfully' });
};