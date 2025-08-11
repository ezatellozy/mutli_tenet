import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public errors?: any[]
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            message: err.message,
            errors: err.errors,
        });

        return;
    }

    res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
};
