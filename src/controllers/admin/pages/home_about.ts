import { Request, Response } from "express";
import sequelize from "../../../../utils/database";
import { ResponseHandler } from "../../../../utils/responseHandler";
import { AppError } from "../../../middleware/errorHandler";
import { Page, PageTranslations, HomeTypes } from "../../../models/pages";
import { Op } from "sequelize";

type Content = {
    title: string;
    content: string;
    name: string;
};

interface TranslatedContent {
    page_id: number;
    locale: string;
    name: string;
    title: string;
    content: string;
}

/**
 * Validate a single translation content.
 */
const validateContent = (content: Content, locale: string, index: number): string[] => {
    const errors: string[] = [];
    if (!content.name) errors.push(`name ${locale} ${index}`);
    if (!content.title) errors.push(`title ${locale} ${index}`);
    if (!content.content) errors.push(`content ${locale} ${index}`);
    return errors;
};


/**
 * Build translation data for bulk operations.
 */
const buildTranslatedContents = (
    translations: Record<string, Content>,
    page_id: number
): { data: TranslatedContent[]; errors: string[] } => {
    const data: TranslatedContent[] = [];
    const errors: string[] = [];

    (<any>Object).entries(translations).forEach(([locale, content]: [string, Content], index: number) => {
        const validationErrors = validateContent(content, locale, index);
        if (validationErrors.length) {
            errors.push(...validationErrors);
        } else {
            data.push({
                page_id,
                locale,
                name: content.name,
                title: content.title,
                content: content.content,
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
    transaction: any
) => {
    const { data, errors } = buildTranslatedContents(translations, page_id);

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
                    name: translation.name,
                    title: translation.title,
                    content: translation.content,
                },
                { transaction }
            );
        } else {
            await PageTranslations.create(translation as PageTranslations, { transaction });
        }
    }
};


export const createHomeAbout = async (req: Request, res: Response): Promise<void> => {
    const { image, type, ar, en } = req.body;

    const errors: string[] = [];
    const allowedTypes = ["message", "vision", "mission"];

    if (!allowedTypes.includes(type)) {

        ResponseHandler.error(res, "Type is not supported", 422, []);
        return
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
        ResponseHandler.error(res, errors[0], 422, errors);
        return
    }

    try {


        const transaction = await sequelize.transaction();
        let page: Page;
        try {
            const currentPage = await Page.findOne({
                where: { type },
                order: [["id", "DESC"]],

            })



            if (currentPage) {


                page = currentPage;
                if (image) {
                    await page.update({ image }, { transaction });
                }
            } else {
                page = await Page.create({ image, type } as Page, { transaction });
            }

            await upsertTranslations(page.id, { ar }, transaction);
            await upsertTranslations(page.id, { en }, transaction);

            await transaction.commit();

        } catch (err) {
            await transaction.rollback();

            if (err instanceof Error) {

                ResponseHandler.error(res, err.message ?? "Failed to create page", 500, []);
            } else {
                ResponseHandler.error(res, "Failed to create page", 500, []);

            }


            return
        }

        const translateData = await PageTranslations.findAll({
            where: { page_id: page.id },
        });
        const translateDataByLocale = translateData.reduce((acc, translation) => {
            acc[translation.locale] = translation;
            return acc;
        }, {} as Record<string, (typeof translateData)[number]>);

        const imageUrl = page.image
            ? `${req.protocol}://${req.get('host')}/images/pages/${page.image.replace(/\\/g, '/')}`
            : null;

        const response = {
            image: imageUrl,
            type: page.type,
            ar: translateDataByLocale["ar"] || null,
            en: translateDataByLocale["en"] || null,
        };

        ResponseHandler.success(res, response);
        return
    } catch (error) {
        if (error instanceof Error) {
            ResponseHandler.error(res, error?.message || "Failed to add page", 500)

        } else {
            ResponseHandler.error(res, "Failed to add page", 500)

        }

    }
};

export const deleteHomeAbout = async (req: Request, res: Response): Promise<void> => {
    const { type } = req.body

    const page = await Page.findOne({ where: { type: type } })
    if (!page) {
        ResponseHandler.error(res, 'Page not found', 422, [])
        return
    }

    await page.destroy().then(() => ResponseHandler.deleted(res)).catch((error) => ResponseHandler.error(res, error?.message ?? "Failed to delete page", 500, []));
}


export const getHomeAbout = async (req: Request, res: Response): Promise<void> => {


    try {
        const allPages = await Page.findAll({
            type: {
                [Op.in]: ["mission", "vision", "message"]
            } as unknown as HomeTypes,
            include: [
                {
                    model: PageTranslations,

                    required: false,
                    attributes: ["locale", "title", "content", "name"]
                }
            ],
            attributes: ["image", "type"]

        })

        const pages = allPages.map((home_page) => {

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
            return {


                image: imageUrl,
                type: resPage.type,

                ...translation,
            };
        });



        ResponseHandler.success(res, pages);

    } catch (error) {
        if (error instanceof Error) {
            ResponseHandler.error(res, error?.message || "Failed to fetch pages", 500, []);

        } else {
            ResponseHandler.error(res, "Failed to fetch pages", 500, []);

        }
    }
}

