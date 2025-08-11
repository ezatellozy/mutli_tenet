import { Request, Response } from "express";
import sequelize from "../../../../utils/database";
import { ResponseHandler } from "../../../../utils/responseHandler";
import { AppError } from "../../../middleware/errorHandler";
import { HomeTypes, Page, PageTranslations } from "../../../models/pages";
import { Op } from "sequelize";

type Content = {
    title: string;
    content: string;
    video?: string;
    button_name: string;
};

interface TranslatedContent extends Content {
    page_id: number;
    locale: string;

}

/**
 * Validate a single translation content.
 */
const validateContent = (
    content: Content,
    locale: string,
    type: string
): string[] => {
    const errors: string[] = [];
    if (!content.title) errors.push(`title is required ${locale}`);
    if (!content.content) errors.push(`content is required  ${locale}`);

    if (!content.button_name && type === "middle_intro")
        errors.push(`Button Name is required  ${locale}`);
    return errors;
};

/**
 * Build translation data for bulk operations.
 */
const buildTranslatedContents = (
    translations: Record<string, Content>,
    page_id: number,
    type: string
): { data: TranslatedContent[]; errors: string[] } => {
    const data: TranslatedContent[] = [];
    const errors: string[] = [];

    (<any>Object).entries(translations).forEach(([locale, content]: [string, Content]) => {
        const validationErrors = validateContent(content, locale, type);
        if (validationErrors.length) {
            errors.push(...validationErrors);
        } else {
            data.push({
                page_id,
                locale,
                title: content.title,
                content: content.content,
                button_name: content.button_name,
            });
        }
    });

    return { data, errors };
};

/**
 * Upsert translations for a given page.
 */
const upsertTranslations = async (
    page_id: number,
    translations: Record<string, Content>,
    transaction: any,
    type: string,

) => {
    const { data, errors } = buildTranslatedContents(translations, page_id, type);
    if (errors.length > 0) {
        throw new AppError(422, errors[0], errors);
    }

    for (const translation of data) {
        const existing = await PageTranslations.findOne({
            where: { page_id, locale: translation.locale },
            transaction,
        });

        if (existing) {
            await existing.update(
                {
                    title: translation.title,
                    content: translation.content,

                    button_name: translation.button_name,
                },
                { transaction }
            );
        } else {
            await PageTranslations.create(translation as PageTranslations, { transaction });
        }
    }
};

export const createHomeIntro = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { type, video, ar, en } = req.body;

    const errors: string[] = [];
    const allowedTypes = ["top_intro", "middle_intro"];

    if (!allowedTypes.includes(type)) {
        ResponseHandler.error(res, "Type is not supported", 422, []);
        return;
    }

    if (!ar || typeof ar !== "object") {
        ResponseHandler.error(res, "Content (ar)", 422, []);
        return;
    }
    if (!en || typeof en !== "object") {
        ResponseHandler.error(res, "Content (en)", 422, []);
        return;
    }


    const arLocales = Object.keys(ar);
    const enLocales = Object.keys(en);
    if (arLocales.length !== enLocales.length) {
        errors.push(
            "Arabic and English content must have the same number of locales"
        );
    }

    arLocales.forEach((locale) => {
        if (!en[locale]) {
            errors.push(`Missing English content for locale: ${locale}`);
        }
    });

    if (errors.length) {
        ResponseHandler.error(res, "Validation errors", 422, errors);
        return;
    }

    try {
        const transaction = await sequelize.transaction();
        let page: Page;
        try {
            const currentPage = await Page.findOne({
                where: { type },
                order: [["id", "DESC"]],
            });

            if (currentPage) {
                page = currentPage;
                if (video) {

                    await page.update({ video }, { transaction });
                }
            } else {
                if (!video && type === "middle_intro") {
                    ResponseHandler.error(res, "video is required", 422);
                    return;
                }
                page = await Page.create({ video, type } as Page, { transaction });
            }

            await upsertTranslations(page.id, { ar }, transaction, type);
            await upsertTranslations(page.id, { en }, transaction, type);

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();

            if (err instanceof Error) {

                ResponseHandler.error(
                    res,
                    err.message ?? "Failed to create page",
                    500,
                    []
                );
            } else {
                ResponseHandler.error(
                    res,
                    "Failed to create page",
                    500,
                    []
                );
            }

            return;
        }

        const translateData = await PageTranslations.findAll({
            where: {
                page_id: page.id,
            },
            attributes: ['title', 'locale', 'content', 'button_name']
        });
        const translateDataByLocale = translateData.reduce((acc, translation) => {
            acc[translation.locale] = translation;
            return acc;
        }, {} as Record<string, (typeof translateData)[number]>);


        const videoUrl = page.video
            ? `${req.protocol}://${req.get(
                "host"
            )}/files/pages/${page.video.replace(/\\/g, "/")}`
            : null;
        // const imageUrl = page.image
        //     ? `${req.protocol}://${req.get(
        //         "host"
        //     )}/files/images/${page.image.replace(/\\/g, "/")}`
        //     : null;

        const response = {
            ...(page.type === 'middle_intro' && { video: videoUrl }),
            type: page.type,
            ar: translateDataByLocale["ar"] || null,
            en: translateDataByLocale["en"] || null,
        };

        ResponseHandler.success(res, response);

    } catch (error) {
        if (error instanceof Error) {

            ResponseHandler.error(res, error?.message ?? 'Failed to add page', 500);
        } else {
            ResponseHandler.error(res, 'Failed to add page', 500);

        }


    }
};


export const getHomeIntro = async (req: Request, res: Response): Promise<void> => {
    const { type } = req.query as { type: string }

    if (!type) {
        ResponseHandler.error(res, 'type is requred', 422)
        return
    }
    const allowedTypes = ["top_intro", "middle_intro"];

    if (!allowedTypes.includes(type)) {
        ResponseHandler.error(res, "Type is not supported", 422, []);
        return;
    }



    try {


        const home_page = await Page.findOne({
            where: {
                type: type
            },
            include: [
                {
                    model: PageTranslations,

                    required: false,
                    attributes: ["locale", "title", "content", "name", "button_name"]
                }
            ],
            attributes: ["image", "type", "video"]
        })

        if (!home_page) {

            ResponseHandler.success(res, null)
            return
        }






        let translateData = []

        if (home_page.PageTranslations.length > 0) {
            translateData = home_page.PageTranslations.map((t: any) => t.get())
        }




        const translation = translateData.reduce((acc, t) => {

            const { locale, ...rest } = t
            acc[locale] = rest

            return acc;
        }, {} as Record<string, (typeof home_page.PageTranslations)[number]>) || {
            ar: null,
            en: null,

        };

        const resPage = home_page.get();
        const imageUrl = resPage.image
            ? `${req.protocol}://${req.get(
                "host"
            )}/images/pages/${resPage.image.replace(/\\/g, "/")}`
            : null;
        const videoUrl = resPage.video
            ? `${req.protocol}://${req.get(
                "host"
            )}/files/pages/${resPage.video.replace(/\\/g, "/")}`
            : null;


        const response = {

            video: videoUrl,
            image: imageUrl,
            type: resPage.type,

            ...translation,
        };
        ResponseHandler.success(res, response);

    } catch (error) {
        if (error instanceof Error) {

            ResponseHandler.error(res, error?.message || "Failed to fetch pages", 500, []);
        } else {
            ResponseHandler.error(res, "Failed to fetch pages", 500, []);

        }
    }
}