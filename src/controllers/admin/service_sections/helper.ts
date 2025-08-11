import { AppError } from "../../../middleware/errorHandler";
import { SectionFeatureTranslation } from "../../../models/service_sections/sectionFeatures";
import { ServiceSectionsTranslation } from "../../../models/service_sections/sections";
import { Content, TranslatedSectionContent, TranslatedFeatureContent } from "./types";

const validateContent = (
    content: Content,
    locale: string,
): string[] => {
    const errors: string[] = [];
    if (!content.title) errors.push(`Section Title is required  ${locale}`);
    return errors;
};


/**
* Build translation data for bulk operations.
*/





export const buildSectionTranslatedContents = (
    translations: Record<string, Content>,
    service_section_id: number): { data: TranslatedSectionContent[]; errors: string[] } => {
    const data: TranslatedSectionContent[] = [];
    const errors: string[] = [];
    (<any>Object).entries(translations).forEach(([locale, content]: [string, Content]) => {
        const validationErrors = validateContent(content, locale);
        if (validationErrors.length) {
            errors.push(...validationErrors);
        } else {
            const translatedContent: TranslatedSectionContent = {
                service_section_id,
                locale,
                title: content.title,
                ...(content.desc && { desc: content.desc }),
            };
            data.push(translatedContent);
        }
    });

    return { data, errors };
};
export const buildFeatureTranslatedContents = (
    translations: Record<string, Content>,
    feature_id: number): { data: TranslatedFeatureContent[]; errors: string[] } => {
    const data: TranslatedFeatureContent[] = [];
    const errors: string[] = [];
    (<any>Object).entries(translations).forEach(([locale, content]: [string, Content]) => {
        const validationErrors = validateContent(content, locale);
        if (validationErrors.length) {
            errors.push(...validationErrors);
        } else {
            const translatedContent: TranslatedFeatureContent = {
                feature_id,
                locale,
                title: content.title,
                ...(content.desc && { desc: content.desc }),
            };
            data.push(translatedContent);
        }
    });

    return { data, errors };
};


// * Upsert Section translations for a given page.


export const upsertSectionTranslations = async (
    service_section_id: number,
    translations: Record<string, Content>,
    transaction: any,
) => {
    const { data, errors } = buildSectionTranslatedContents(translations, service_section_id);
    if (errors.length > 0) {
        throw new AppError(422, errors[0], errors);
    }
    for (const translation of data) {
        const existing = await ServiceSectionsTranslation.findOne({
            where: { service_section_id, locale: translation.locale },
            transaction,
        });

        if (existing) {
            const updateData: Partial<typeof translation> = {
                title: translation.title,
                desc: translation.desc,
            };

            await existing.update(updateData, { transaction });
        } else {
            await ServiceSectionsTranslation.create(translation, { transaction });
        }
    }
};
// * Upsert Feature translations for a given page.

export const upsertFeatureTranslations = async (
    feature_id: number,
    translations: Record<string, Content>,
    transaction: any,
) => {
    const { data, errors } = buildFeatureTranslatedContents(translations, feature_id);
    if (errors.length > 0) {
        throw new AppError(422, errors[0], errors);
    }
    for (const translation of data) {
        const existing = await SectionFeatureTranslation.findOne({
            where: { feature_id, locale: translation.locale },
            transaction,
        });
        if (existing) {
            const updateData: Partial<typeof translation> = {
                title: translation.title,
                desc: translation.desc,
            };
            await existing.update(updateData, { transaction });
        } else {

            await SectionFeatureTranslation.create(translation, { transaction });

        }
    }
};
