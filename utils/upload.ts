import fs from "fs";
import multer, { StorageEngine } from "multer";
import path from "path";
import { Request } from "express";
import { AppError } from "../src/middleware/errorHandler";
import crypto from "crypto";

interface MulterFile extends Express.Multer.File { }
export const upload = (folder: string, filePath?: string): multer.Multer => {
    let allowedExtensions = [];
    let message = "Invalid file type. Only images are allowed!";
    if (filePath === "files") {
        allowedExtensions = [".mp4", ".pdf"];
        message = "Invalid file type. Only [mp4 , pdf] are allowed!";
    } else if (filePath === "images")
        allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    // Ensure the folder exists
    const folderPath = filePath
        ? `public/storage/${filePath}/${folder}`
        : `public/storage/${folder}`;

    if (!fs.existsSync(folderPath)) {
        try {
            fs.mkdirSync(folderPath, { recursive: true });
        } catch (err: unknown) {
            if (err instanceof Error) {
                throw new AppError(
                    500,
                    err.message ?? "Failed to create upload directory"
                );
            } else {
                throw new AppError(
                    500,
                    "Unknown error occurred while creating upload directory"
                );
            }
        }
    }

    const storage: StorageEngine = multer.diskStorage({
        destination: (
            _req: Request,
            _file: MulterFile,
            cb: (error: Error | null, destination: string) => void
        ) => {
            cb(null, folderPath);
        },
        filename: (
            _req: Request,
            file: MulterFile,
            cb: (error: Error | null, destination: string) => void
        ) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const uniqueHash = crypto.randomBytes(20).toString("hex");
            cb(null, `${uniqueHash}${ext}`);
        },
    });

    return multer({
        storage,
        limits: { fileSize: 50 * 1024 * 1024 }, // 10MB file limit
    });
};
