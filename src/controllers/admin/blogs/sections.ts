import { Request, Response } from "express";
import { ResponseHandler } from "../../../../utils/responseHandler";
import { BlogSection } from "../../../models/blogs/sections";
import { upsertBlogSectionTranslations } from "./helper";


interface SectionCreateType {
    image?: string
    en: {
        title: string
        desc: string
        locale: string
        section_id: number
    }
    ar: {
        title: string
        desc: string
        locale: string
        section_id: number
    }
    id?: number
}

export const createSection = async (section: SectionCreateType, transaction: any, blog_id: number) => {
    const { image, ar, en, id } = section;
    let newSection
    let existing

    if (id) {
        existing = await BlogSection.findOne({
            where: {
                id,
                blog_id: blog_id

            }
        })
        if (existing) {

            newSection = await existing.update(
                {
                    ...(image && { image }),
                    blog_id,
                },
                { transaction }
            );
        } else {
            newSection = await BlogSection.create(
                {
                    ...(image && { image }),
                    blog_id,
                },
                { transaction }
            );
        }


    } else {


        newSection = await BlogSection.create(
            {
                ...(image && { image }),
                blog_id,
            },
            { transaction }
        );
    }
    await upsertBlogSectionTranslations(newSection.id, { ar }, transaction);
    await upsertBlogSectionTranslations(newSection.id, { en }, transaction);
}



export const deleteBlogSection = async (
    req: Request,
    res: Response
): Promise<void> => {
    const section = await BlogSection.findByPk(req.params.id);

    if (!section) {
        ResponseHandler.error(res, 'Section not found', 404)

        return;
    }
    await section
        .destroy()
        .then(() => ResponseHandler.deleted(res, 'Section deleted successfully'))
        .catch((error) => ResponseHandler.error(res, error instanceof Error ? error.message || 'Section not found' : 'Section not found', 500));
};