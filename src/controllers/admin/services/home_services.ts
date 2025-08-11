import { Request, Response } from "express";
import { ResponseHandler } from "../../../../utils/responseHandler";
import {
    HomeService,
    HomeServiceTranslation,
} from "../../../models/services/home_services";
import {
    Service
} from "../../../models/services/services";
import { AppError } from "../../../middleware/errorHandler";
import sequelize from "../../../../utils/database";

interface Content {
    title: string;
    desc: string;
    locale: string;
}

interface TranslatedContent extends Content {
    locale: string;
    service_id: number;
}

/**
 * Validate a single translation content.
 */
const validateContent = (
    content: Content,
    locale: string,
): string[] => {
    const errors: string[] = [];
    if (!content.title) errors.push(`title is required ${locale}`);
    if (!content.desc) errors.push(`content is required  ${locale}`);
    return errors;
};

/**
 * Build translation data for bulk operations.
 */
const buildTranslatedContents = (
    translations: Record<string, Content>,
    service_id: number,

): { data: TranslatedContent[]; errors: string[] } => {
    const data: TranslatedContent[] = [];
    const errors: string[] = [];
    (<any>Object).entries(translations).forEach(([locale, content]: [string, Content]) => {
        const validationErrors = validateContent(content, locale);
        if (validationErrors.length) {
            errors.push(...validationErrors);
        } else {
            data.push({
                service_id,
                locale,
                title: content.title,
                desc: content.desc,
            });
        }
    });

    return { data, errors };
};

/**
 * Upsert translations for a given page.
 */
const upsertTranslations = async (
    service_id: number,
    translations: Record<string, Content>,
    transaction: any,


) => {
    const { data, errors } = buildTranslatedContents(translations, service_id);
    if (errors.length > 0) {

        throw new AppError(422, errors[0], errors);
    }

    for (const translation of data) {
        const existing = await HomeServiceTranslation.findOne({
            where: { service_id, locale: translation.locale },
            transaction,
        });

        if (existing) {
            await existing.update(
                {
                    title: translation.title,
                    desc: translation.desc,
                },
                { transaction }
            );
        } else {
            await HomeServiceTranslation.create(translation, { transaction });
        }
    }
};

export const createHomeService = async (req: Request, res: Response): Promise<void> => {
    const { ar, en, color, icon, service_id } = req.body;
    const errors: string[] = []
    if (!icon) errors.push("icon is required");
    if (!color) errors.push("color is required");
    if (!service_id) errors.push("service is required");
    const servive = await Service.findByPk(service_id)
    if (!servive) errors.push("Service not found")

    if (errors.length > 0) {
        ResponseHandler.error(res, errors[0], 422, errors)
        return
    }

    try {

        const transaction = await sequelize.transaction();
        const serviceData = await HomeService.create({
            icon: icon,
            color: color,
            service_id

        }, {
            transaction
        });
        try {
            // Process translations
            await upsertTranslations(serviceData.id, { ar }, transaction);
            await upsertTranslations(serviceData.id, { en }, transaction);
            await transaction.commit()
        } catch (error) {
            await transaction.rollback();


            if (error instanceof Error) {

                ResponseHandler.error(
                    res,
                    error.message ?? "Failed to create page",
                    500
                );
            } else {

                ResponseHandler.error(res, "Failed to create page", 500)
            }
            return;
        }


        // Bulk insert translations
        const translateData = await HomeServiceTranslation.findAll({
            where: { service_id: serviceData.id },
            attributes: ['title', 'desc', 'locale']
        });

        const translationsByLocale = translateData.reduce(
            (acc: { [key: string]: any }, translation) => {
                const { locale, ...rest } = translation.get();
                acc[locale] = rest;
                return acc;
            },
            {} as Record<string, (typeof translateData)[number]>
        );

        ResponseHandler.success(
            res,
            {
                ...serviceData.get(),
                ar: translationsByLocale["ar"] || null,
                en: translationsByLocale["en"] || null,
            },
            "Service created successfully"
        );
    } catch (err) {
        if (err instanceof Error) {

            ResponseHandler.error(
                res,
                err.message ?? "Failed to create service",
                500
            );
        } else {

            ResponseHandler.error(res, "Failed to create service", 500)
        }
    }
};

export const updateHomeService = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { ar, en, icon, color, service_id } = req.body;

    const errors: string[] = [];

    try {
        const serviceData = await HomeService.findByPk(id);
        if (!serviceData) {
            ResponseHandler.error(res, "Service not found", 422);
            return;
        }
        if (!serviceData.icon && !icon) errors.push("icon is required");
        if (!serviceData.color && !color) errors.push("color is required");
        if (!service_id) errors.push("service is required");

        const servive = await Service.findByPk(service_id)
        if (!servive) errors.push("Service not found")
        if (errors.length > 0) {
            ResponseHandler.error(res, errors[0], 422);
            return;
        }



        await serviceData.update({
            ...(icon && { icon: icon }),
            ...(color && { color: color }),
            service_id: service_id
        });

        const transaction = await sequelize.transaction();
        try {

            await upsertTranslations(serviceData.id, { ar }, transaction);
            await upsertTranslations(serviceData.id, { en }, transaction);
            await transaction.commit()

        } catch (err) {
            await transaction.rollback();

            if (err instanceof Error) {

                ResponseHandler.error(
                    res,
                    err.message ?? "Failed to update service",
                    500
                );
            } else {

                ResponseHandler.error(res, "Failed to update service", 500)
            }

            return;

        }



        const updatedTranslations = await HomeServiceTranslation.findAll({
            where: { service_id: id },
            attributes: ['title', 'desc', 'locale']
        });

        const translationsByLocale = updatedTranslations.reduce(
            (acc: { [key: string]: any }, translation) => {
                const { locale, ...rest } = translation.get();
                acc[locale] = rest;
                return acc;
            },
            {} as Record<string, (typeof updatedTranslations)[number]>
        );

        ResponseHandler.success(
            res,
            {
                ...serviceData.get(),
                ar: translationsByLocale["ar"] || null,
                en: translationsByLocale["en"] || null,
            },
            "Service updated successfully"
        );
    } catch (error) {
        if (error instanceof Error) {

            ResponseHandler.error(res, error?.message || "Internal server error", 500)
        } else {

            ResponseHandler.error(res, "Internal server error", 500)
        }
    }
};

export const deleteHomeService = async (req: Request, res: Response): Promise<void> => {
    const service = await HomeService.findByPk(req.params.id);
    if (!service) {
        ResponseHandler.error(res, "Service not found", 422)

        return
    }

    await service
        .destroy()
        .then(() =>
            ResponseHandler.deleted(res, "Service deleted successfully")
        )
        .catch((error) => ResponseHandler.error(res, error?.message || 'unknown error', 500))
};

export const getHomeServiceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id;


        const service = await HomeService.findByPk(id, {
            include: [
                {
                    model: HomeServiceTranslation,

                    attributes: ["title", "desc", "locale"],
                    required: false,
                },
            ],
            attributes: ["id", "icon", "color", "service_id"],
            nest: true
        });

        if (!service) {
            ResponseHandler.error(res, "Service not found", 404)
            return
        };

        const resService = service.get();


        let translateData = []

        if (service.HomeServiceTranslations.length > 0) {
            translateData = service.HomeServiceTranslations.map((t: any) => t.get())
        }


        const translationsByLocale = translateData.length ? translateData.reduce(
            (acc: { [key: string]: any }, translation: any) => {
                const { locale, ...rest } = translation;
                acc[locale] = rest;
                return acc;
            },
            {} as Record<string, (typeof service.HomeServiceTranslations)[number]>
        ) : {
            ar: null,
            en: null,
        };


        const imageUrl = resService.icon
            ? `${req.protocol}://${req.get(
                "host"
            )}/images/services/${resService.icon.replace(/\\/g, "/")}`
            : null;

        const response = {
            id: resService.id,
            color: resService.color,
            service: resService.service_id,

            icon: imageUrl,
            ar: translationsByLocale["ar"] || null,
            en: translationsByLocale["en"] || null,
        };

        ResponseHandler.success(res, response)
    } catch (err) {
        if (err instanceof Error) {

            ResponseHandler.error(res, err?.message || "Internal server error", 500)
        } else {

            ResponseHandler.error(res, "Internal server error", 500)
        }
    }
};

export const getHomeServicesIndex = async (req: Request, res: Response): Promise<void> => {
    try {
        const lang = req.headers["accept-language"] ?? "en";

        const services = await HomeService.findAll({
            include: [
                {
                    model: HomeServiceTranslation,
                    where: { locale: lang },
                    attributes: ["title", "desc"],
                    required: false,
                },
            ],
            attributes: ["id", "icon", "color"],
        });

        if (!services) {
            ResponseHandler.success(res, [])
            return
        }


        const servcesRes = services.map((service) => {
            const resService = service.get();

            const imageUrl = service.icon
                ? `${req.protocol}://${req.get(
                    "host"
                )}/images/services/${service.icon.replace(/\\/g, "/")}`
                : null;

            const translation = service.HomeServiceTranslations?.[0]?.get() || {
                title: null,
                desc: null,
            };

            const { id, ...filterTranslations } = translation

            return {
                id: resService.id,

                color: resService.color,
                icon: imageUrl,

                ...filterTranslations,
            };
        });

        ResponseHandler.success(res, servcesRes)


    } catch (err) {
        if (err instanceof Error) {

            ResponseHandler.error(res, err?.message || "Internal server error", 500)
        } else {
            ResponseHandler.error(res, "Internal server error", 500)
        }
    }
};
