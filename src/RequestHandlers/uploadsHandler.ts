import { Request, Response, NextFunction } from 'express';
import { createMulterInstance } from '../Helpers/uploadsHelper';
import multer from 'multer';

const uploadImage = createMulterInstance('image', 5 * 1024 * 1024); // 5MB
const uploadAudio = createMulterInstance('audio', 10 * 1024 * 1024); // 10MB

export function upload_image(req: Request, res: Response, next: NextFunction) {
    uploadImage(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(500).json({ error: err.message });
        } else if (err) {
            console.error('Upload Error:', err);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            console.error('No image file uploaded.');
            return res.status(400).json({ error: 'No image file uploaded.' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
        res.status(200).json({ message: 'Image file successfully uploaded', url: imageUrl });
    });
}

export function upload_audio(req: Request, res: Response, next: NextFunction) {
    uploadAudio(req, res, function (err: any) {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(500).json({ error: err.message });
        } else if (err) {
            console.error('Upload Error:', err);
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            console.error('No audio file uploaded.');
            return res.status(400).json({ error: 'No audio file uploaded.' });
        }

        const audioUrl = `${req.protocol}://${req.get('host')}/uploads/audios/${req.file.filename}`;
        res.status(200).json({ message: 'Audio file successfully uploaded', url: audioUrl });
    });
}
