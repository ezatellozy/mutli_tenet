import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.validateAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            }, { abortEarly: false });

            next();
        } catch (error) {
            if (error instanceof Joi.ValidationError) {
                const errors = error.details.map((detail) => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                }));

                res.status(422).json({
                    message: 'Validation failed',
                    errors,
                });
                return
            }

            next(error);
        }
    };
};
