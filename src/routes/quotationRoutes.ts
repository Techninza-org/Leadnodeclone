import express from 'express';
import { PdfService } from '../services/pdfService';

const router = express.Router();
const pdfService = new PdfService();

router.get('/quotations/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;
        const pdfStream = await pdfService.getPdfStream(fileName);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        
        pdfStream.pipe(res);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
});

export default router;
