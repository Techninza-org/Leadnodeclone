import { ExtendedRequest } from "../middleware/authMiddleware";
import { Response } from 'express';
import userWorker from "../workers/userWorker";

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
    const { id, isOffer, isTemplate, isMessage, message } = req.body;
    

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
            message,
            imgURL: fileInfos,
            companyId: user?.companyId,
        });

        return res.status(200).json({ update });
    } catch (error: any) {
        return res.status(500).json({ error: 'Failed to update broadcast message.', details: error.message });
    }
};
