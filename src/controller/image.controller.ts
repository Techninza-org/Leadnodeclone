import { ExtendedRequest } from "../middleware/authMiddleware";
import { Response } from 'express';

export const uploadImage = (req: ExtendedRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files) {
        return res.status(400).send('No file uploaded.');
    }
    const fileInfos = files.map(file => ({
        fieldname: file.fieldname, // Capturing the original field name
        url: `${req.protocol}://${req.get('host')}/images/${file.filename}`
    }));

    res.status(200).json({ files: fileInfos });
};