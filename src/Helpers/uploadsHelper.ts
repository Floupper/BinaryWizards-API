import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

export const FILE_TYPES = {
    image: /jpeg|jpg|png|gif/,
    audio: /mp3|wav|ogg/
};

export const generateUniqueFilename = (originalName: string): string => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    return uniqueSuffix + path.extname(originalName);
};

export const configureStorage = (type: 'image' | 'audio'): StorageEngine => {
    const destination = path.join(__dirname, '../../public/uploads', `${type}s`);

    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    return multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, destination);
        },
        filename: function (req, file, cb) {
            cb(null, generateUniqueFilename(file.originalname));
        }
    });
};

export const createFileFilter = (type: 'image' | 'audio') => {
    return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        const extname = FILE_TYPES[type].test(path.extname(file.originalname).toLowerCase());
        const mimetype = FILE_TYPES[type].test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error(`Only ${type}s files are authorized.`));
        }
    };
};

export const createMulterInstance = (type: 'image' | 'audio', sizeLimit: number) => {
    const storage = configureStorage(type);
    const fileFilter = createFileFilter(type);

    return multer({
        storage: storage,
        limits: { fileSize: sizeLimit },
        fileFilter: fileFilter
    }).single(type);
};