import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ResponseHandler } from "../../utils/responseHandler";

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload: Record<string, unknown> = {};
      if (schema.describe().keys?.body) payload.body = req.body;
      if (schema.describe().keys?.query) payload.query = req.query;
      if (schema.describe().keys?.params) payload.params = req.params;

      await schema.validateAsync(payload, { abortEarly: false });
      next();
    } catch (error) {
      if (error instanceof Joi.ValidationError) {
        const errors = error.details.map((detail) => detail.message);
        ResponseHandler.error(
          res,
          error.details[0]?.message || "Validation failed",
          422,
          errors
        );
        return;
      }
      next(error);
    }
  };
};
