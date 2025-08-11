import Joi from 'joi';

export const createHomeServiceSchema = Joi.object({
    body: Joi.object({
        color: Joi.string().required(),
        services: Joi.object({
            ar: Joi.object({
                title: Joi.string().required(),
                desc: Joi.string().required(),
            }),
            en: Joi.object({
                title: Joi.string().required(),
                desc: Joi.string().required(),
            }),
        }).required(),
    }),
});

export const updateHomeServiceSchema = Joi.object({
    params: Joi.object({
        id: Joi.string().required(),
    }),
    body: Joi.object({
        color: Joi.string().optional(),
        services: Joi.object({
            ar: Joi.object({
                title: Joi.string().required(),
                desc: Joi.string().required(),
            }),
            en: Joi.object({
                title: Joi.string().required(),
                desc: Joi.string().required(),
            }),
        }).required(),
    }),
});
