import { ExtendedRequest } from "../middleware/authMiddleware";
import { Response } from 'express';
import userWorker from "../workers/userWorker";
import prisma from "../config/database";
import exceljs from "exceljs";
import csvtojson from "csvtojson";
import { validateLeadCSV } from "../utils/validator";
import { format, parse } from "date-fns";

export const uploadImage = (req: ExtendedRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files) {
        return res.status(400).send('No file uploaded.');
    }
    const fileInfos = files.map(file => ({
        fieldname: file.fieldname, // Capturing the original field name
        url: `${req.protocol}://${req.get('host')}/graphql/images/${file.filename}`
    }));

    res.status(200).json({ files: fileInfos });
};

export const broadcastMessage = async (req: ExtendedRequest, res: Response) => {
    const user = req.user;
    const { id, isOffer, isTemplate, isMessage, message, isMessage1, isMessage2, isMessage3 } = req.body;


    if (!message) {
        return res.status(400).json({ error: 'ID and message are required fields.' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const fileInfos = files.map(file => ({
        fieldname: file.fieldname,
        url: `${req.protocol}://${req.get('host')}/graphql/images/${file.filename}`
    }));

    try {
        const update = await userWorker.createNUpdateBroadcast({
            id,
            isOffer: isOffer === 'true' ? true : false,
            isTemplate: isTemplate === 'true' ? true : false,
            isMessage: isMessage === 'true' ? true : false,
            isMessage1: isMessage1 === 'true' ? true : false,
            isMessage2: isMessage2 === 'true' ? true : false,
            isMessage3: isMessage3 === 'true' ? true : false,
            message,
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

        console.log(leads, "leads");

        const createdLeads = await prisma.lead.createMany({ data: leads });

        return res.status(200).json({ valid: true, message: "Leads uploaded successfully", createdLeads });

    } catch (error: any) {
        console.log(error, "error");
        return res.status(500).json({ error: 'Failed to upload lead.', details: error.message });
    }
};