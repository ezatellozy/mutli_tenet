import { Op } from "sequelize";
import { AppError } from "../../../../middleware/errorHandler";
import { ProjectTrans } from "../../../../models/projects/project";


interface Content {
    name: string
    desc: string
    platform: string
    location: string
    locale: string
    project_id: number
    about_title: string
    about_desc: string
    slug: string
}


const validateTrans = (translation: Content, locale: string): string[] => {
    const errors: string[] = []
    if (!translation.name) errors.push(`${locale} name is required`)
    if (!translation.desc) errors.push(`${locale} desc is required`)
    if (!translation.platform) errors.push(`${locale} platform is required`)
    if (!translation.location) errors.push(`${locale} location is required`)
    if (!translation.slug) errors.push(`${locale} slug is required`)
    if (!translation.about_title) errors.push(`${locale} about title is required`)
    if (!translation.about_desc) errors.push(`${locale} about desc is required`)
    return errors

}


const buildProjectTrans = (translations: Record<string, Content>, project_id: number): { data: Content[], errors: string[] } => {
    const data: Content[] = [];
    const errors: string[] = [];


    (<any>Object).entries(translations).forEach(([locale, content]: [string, Content]) => {

        const validationErrors = validateTrans(content, locale)
        if (validationErrors.length) {
            errors.push(...validationErrors)
        } else {
            data.push({
                locale,
                project_id,
                name: content.name,
                desc: content.desc,
                platform: content.platform,
                location: content.location,
                slug: content.slug,
                about_title: content.about_title,
                about_desc: content.about_desc
            })
        }
    })

    return { data, errors }
}


const upsertProjectTrans = async (project_id: number, translations: Record<string, Content>, transaction: any) => {
    const { data, errors } = buildProjectTrans(translations, project_id)
    if (errors.length) {
        throw new AppError(422, errors[0], errors);
    }
    for (const translation of data) {
        const slugExists = translation.slug ? await ProjectTrans.findOne({
            where: {
                slug: translation.slug,
                locale: translation.locale,
                project_id: { [Op.ne]: project_id },
            },
            transaction,
        }) : null;

        if (slugExists) {
            throw new AppError(422, `Slug "${translation.slug}" is already in use for locale ${translation.locale}.`, []);
        }
        const existing = await ProjectTrans.findOne({
            where: { project_id, locale: translation.locale },
            transaction,
        });
        if (existing) {
            await existing.update(translation, { transaction })
        } else {
            await ProjectTrans.create(translation, { transaction })
        }
    }
}


export { upsertProjectTrans };

