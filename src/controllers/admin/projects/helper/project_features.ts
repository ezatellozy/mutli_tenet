
import { AppError } from "../../../../middleware/errorHandler";
import { ProjectFeature, ProjectFeatureTrans } from "../../../../models/projects/project_features";
import { ProjectTrans } from "../../../../models/projects/project";


interface Content {
    locale: string
    project_id: number
    feature_title: string
    feature_desc: string

}
interface FeatureContent {
    locale: string
    project_feature_id: number
    name: string
    desc?: string

}


const validateProjectTrans = (translation: Content, locale: string): string[] => {
    const errors: string[] = []
    if (!translation.feature_title) errors.push(`${locale} feature title is required`)
    if (!translation.feature_desc) errors.push(`${locale} feature desc is required`)
    return errors

}
const validateFeatureTrans = (translation: FeatureContent, locale: string): string[] => {
    const errors: string[] = []
    if (!translation.name) errors.push(`${locale} name is required`)
    return errors
}


const buildProjectTrans = (translations: Record<string, Content>, project_id: number): { data: Content[], errors: string[] } => {
    const data: Content[] = [];
    const errors: string[] = [];
    (<any>Object).entries(translations).forEach(([locale, content]: [string, Content]) => {
        const validationErrors = validateProjectTrans(content, locale)
        if (validationErrors.length) {
            errors.push(...validationErrors)
        } else {
            data.push({
                locale,
                project_id,
                feature_title: content.feature_title,
                feature_desc: content.feature_desc

            })
        }
    })
    return { data, errors }
}

const upsertProjectTrans = async (project_id: number, translations: Record<string, Content>, transaction: any) => {
    const { data, errors } = buildProjectTrans(translations, project_id)
    if (errors.length) {
        throw new AppError(500, errors[0], errors);

    }
    for (const translation of data) {

        const existing = await ProjectTrans.findOne({
            where: { project_id, locale: translation.locale },
            transaction,
        });
        if (existing) {
            await existing.update(translation, { transaction })
        }
    }
}
const buildFeatureTrans = (translations: Record<string, FeatureContent>, project_feature_id: number): { data: FeatureContent[], errors: string[] } => {
    const data: FeatureContent[] = [];
    const errors: string[] = [];
    (<any>Object).entries(translations).forEach(([locale, content]: [string, FeatureContent]) => {
        const validationErrors = validateFeatureTrans(content, locale)
        if (validationErrors.length) {
            errors.push(...validationErrors)
        } else {
            data.push({
                locale,
                project_feature_id,
                name: content.name,
                ...(content.desc && { desc: content.desc }),
            });
        }
    })
    return { data, errors }
}

const upsertFeatureTrans = async (project_feature_id: number, translations: Record<string, FeatureContent>, transaction: any) => {
    const { data, errors } = buildFeatureTrans(translations, project_feature_id)
    if (errors.length) {
        throw new AppError(422, errors[0], errors);
    }
    for (const translation of data) {

        const existing = await ProjectFeatureTrans.findOne({
            where: { project_feature_id, locale: translation.locale },
            transaction,
        });
        if (existing) {
            await existing.update(translation, { transaction })
        } else {
            await ProjectFeatureTrans.create(translation, { transaction })
        }
    }
}




export { upsertProjectTrans, upsertFeatureTrans };

