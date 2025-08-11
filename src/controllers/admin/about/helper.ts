import { AppError } from "../../../middleware/errorHandler";

import { AboutTranslate } from "../../../models/about_us";


interface Content {
    title: string;
    desc: string;
}

interface TranslatedContent extends Content {
    locale: string;
    about_id: number;
}

const validateContent = (
    content: Content,
    locale: string,

): string[] => {
    const errors: string[] = [];

    if (!content.title) errors.push(`Title is required  ${locale}`);
    if (!content.desc) errors.push(`Desc is required  ${locale}`);
    return errors;
};

export const buildAboutTranslatedContents = (
    translations: Record<string, Content>,
    about_id: number): { data: TranslatedContent[]; errors: string[] } => {
    const data: TranslatedContent[] = [];
    const errors: string[] = [];
    (<any>Object).entries(translations).forEach(([locale, content]: [string, Content]) => {
        const validationErrors = validateContent(content, locale);
        if (validationErrors.length) {
            errors.push(...validationErrors);
        } else {
            const translatedContent: TranslatedContent = {
                about_id,
                locale,
                title: content.title,
                desc: content.desc
            };
            data.push(translatedContent);
        }
    });

    return { data, errors };
};



export const upsertAboutTranslations = async (
    about_id: number,
    translations: Record<string, Content>,
    transaction: any,
) => {
    const { data, errors } = buildAboutTranslatedContents(translations, about_id);
    if (errors.length > 0) {
        throw new AppError(422, errors[0], errors);
    }
    for (const translation of data) {
        const existing = await AboutTranslate.findOne({
            where: { about_id, locale: translation.locale },
            transaction,
        });

        if (existing) {
            const updateData: Partial<typeof translation> = {
                title: translation.title,
                desc: translation.desc,
            };

            await existing.update(updateData, { transaction });
        } else {
            await AboutTranslate.create(translation, { transaction });
        }
    }
};

