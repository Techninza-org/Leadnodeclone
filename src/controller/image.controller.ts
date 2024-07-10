import { Response } from "express";
import { ExtendedRequest } from "../middleware/authMiddleware";

const uploadImage = async (req: ExtendedRequest, res: Response) => {
    try {
        console.log(req.files, "file")
        if (!req.files) {
            return res.status(400).send('No file uploaded.');
        }
        const files = req.files as Express.Multer.File[];
        const urls = files.map((file: Express.Multer.File) => `/images/${file.filename}`)
        return res.status(200).send(urls);
    } catch (error: any) {
        return res.status(500).send(error.message);
    }
}

export { uploadImage };