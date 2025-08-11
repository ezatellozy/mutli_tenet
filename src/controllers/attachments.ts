import { Response, Request, NextFunction } from "express"
import { AppError } from "../middleware/errorHandler";
import { ResponseHandler } from "../../utils/responseHandler";
import { upload } from '../../utils/upload';


// interface UpdateOptions extends Request {
//     model: string,
//     type: string,
//     file: any
// }

export const dynamicUploadMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const { model, type } = req.headers;

    const types = ['image', 'file']

    if (!type) {
        return next(new AppError(422, "Type is required"));
    }
    if (!model) {
        return next(new AppError(422, "Model is required"));
    }
    if (!types.includes(type as string)) {
        return next(new AppError(422, "Type is not supported"));
    }

    let filePath = type === "image" ? "images" : "files";

    const fileUploader = upload(model as string, filePath).single("file");

    fileUploader(req, res, (uploadErr) => {
        if (uploadErr) {
            if (uploadErr.message.includes("Invalid file type")) {
                return res.status(400).json({ success: false, message: uploadErr.message });
            }
            return next(new AppError(500, uploadErr.message || "File upload failed."));
        }
        next();
    });
};

export const Attachments = (req: Request, res: Response) => {
    const file = req.file
    ResponseHandler.success(res, file?.filename, 'Uploaded file successfully');
}