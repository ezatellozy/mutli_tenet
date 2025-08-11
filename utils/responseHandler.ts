import { Response } from 'express';

export class ResponseHandler {
    static success(res: Response, data?: any, message = 'Success') {
        return res.status(200).json({
            status: 'success',
            message,
            data,
        });
    }
    static paginated(res: Response, data?: any, message = 'Success') {
        return res.status(200).json({
            status: 'success',
            message,
            ...data,
        });
    }

    static created(res: Response, data?: any, message = 'Created successfully') {
        return res.status(201).json({
            status: 'success',
            message,
            data,
        });
    }
    static deleted(res: Response, data?: any, message = 'Deleted successfully') {
        return res.status(201).json({
            status: 'success',
            message,
            data,
        });
    }
    static failed(res: Response, errors: string[], message = '') {

        const allErrors = errors.map(err => err + ' is required')
        return res.status(422).json({
            status: 'fail',
            message: message ? message : allErrors.length ? allErrors[0] : '',
            errors: allErrors
        });
    }

    static error(
        res: Response,
        message = 'Internal server error',
        statusCode = 500,
        errors?: string[]
    ) {
        return res.status(statusCode).json({
            status: 'fail',
            message,
            errors,
        });
    }
}
