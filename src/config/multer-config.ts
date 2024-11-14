import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        
        // Remove "between" (case-insensitive) and then remove all spaces from fieldname and originalname
        const sanitizedFieldname = file.fieldname.replace(/between/gi, "").replace(/\s+/g, "");
        const sanitizedOriginalname = file.originalname.replace(/between/gi, "").replace(/\s+/g, "");
        
        // Generate the final filename without spaces
        const finalFilename = `${sanitizedFieldname}-${uniqueSuffix}${path.extname(sanitizedOriginalname) || '.jpg'}`;
        
        cb(null, finalFilename);
    }
});


const upload = multer({ storage: storage });

export default upload;

const readOnlystorage = multer.memoryStorage();
export const readOnlyupload = multer({ storage: readOnlystorage });
