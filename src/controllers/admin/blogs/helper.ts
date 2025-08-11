import { AppError } from "../../../middleware/errorHandler";
import { BlogTranslate } from "../../../models/blogs/blogs";

import { BlogSectionsTranslate } from "../../../models/blogs/sections"


interface Content {
    locale: string
    title: string
    desc: string
    short_desc: string
    slug: string
    blog_id: number
    type: string
}

interface SectionContent {
    title: string
    desc: string
    locale: string
    section_id: number
}

const validateContent = (
    content: Content,
    locale: string,

): string[] => {
    const errors: string[] = [];
    if (!content.title) errors.push(`Blog Title is required  ${locale}`);
    if (!content.desc) errors.push(`Blog desc is required  ${locale}`);

    if (!content.slug) errors.push(`Blog slug is required  ${locale}`);
    if (!content.short_desc) errors.push(`Blog short desc is required  ${locale}`);
    return errors;
};

const validateSectionContent = (
    content: SectionContent,
    locale: string,

): string[] => {
    const errors: string[] = [];
    if (!content.title) errors.push(`Blog Title is required  ${locale}`);
    if (!content.desc) errors.push(`Blog desc is required  ${locale}`);

    return errors;
};

export const buildBlogTranslatedContents = (translations: Record<string, Content>, blog_id: number): { data: Content[]; errors: string[] } => {
    const data: Content[] = [];
    const errors: string[] = [];

    (<any>Object).entries(translations).forEach(([locale, content]: [string, Content]) => {
        const validationErrors = validateContent(content, locale);

        if (validationErrors.length) {
            errors.push(...validationErrors)
        } else {
            data.push({
                locale,
                blog_id,
                title: content.title,
                type: content.type,
                desc: content.desc,
                short_desc: content.short_desc,
                slug: content.slug ? content.slug.trim().split(' ').join('-') : '',
            })
        }
    })
    return { data, errors }
}

export const upsertBlogTranslations = async (blog_id: number, translations: Record<string, Content>, transaction: any) => {

    const { data, errors } = buildBlogTranslatedContents(translations, blog_id)

    if (errors.length) {
        throw new AppError(422, errors[0], errors);
    }

    for (const translation of data) {

        const existing = await BlogTranslate.findOne({
            where: {
                blog_id,
                locale: translation.locale
            },
            transaction
        })
        if (existing) {
            const updatedDate = {
                title: translation.title,
                desc: translation.desc,
                type: translation.type,
                short_desc: translation.short_desc,
                slug: translation.slug ? translation.slug.trim().split(' ').join('-') : '',

            }
            await existing.update(updatedDate, { transaction })

        } else {
            await BlogTranslate.create(translation, { transaction })
        }
    }
}




export const buildBlogSectionsTrans = (translations: Record<string, SectionContent>, section_id: number): { data: SectionContent[]; errors: string[] } => {
    const data: SectionContent[] = [];
    const errors: string[] = [];



    (<any>Object).entries(translations).forEach(([locale, content]: [string, SectionContent]) => {

        const validtions = validateSectionContent(content, locale)

        if (validtions.length) {

            errors.push(...validtions)

            return
        }

        data.push({

            title: content.title,
            desc: content.desc,
            locale: locale,
            section_id,
        })
    })
    return { data, errors }
}

export const upsertBlogSectionTranslations = async (
    section_id: number,
    translations: Record<string, SectionContent>,
    transaction: any,
) => {
    const { data, errors } = buildBlogSectionsTrans(translations, section_id);
    if (errors.length > 0) {
        throw new AppError(422, errors[0], errors);
    }
    for (const translation of data) {
        const existing = await BlogSectionsTranslate.findOne({
            where: { section_id, locale: translation.locale },
            transaction,
        });
        if (existing) {
            const updateData: Partial<typeof translation> = {
                title: translation.title,
                desc: translation.desc,
            };
            await existing.update(updateData, { transaction });
        } else {
            await BlogSectionsTranslate.create(translation, { transaction });
        }
    }
};
