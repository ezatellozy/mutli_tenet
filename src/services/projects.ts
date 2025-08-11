import { Feature, FeatureTranslation } from "../models/features";
import { Project, ProjectTrans } from "../models/projects/project";
import { ProjectFeature, ProjectFeatureTrans } from "../models/projects/project_features";
import { ProjectImage, ProjectMainFeature, ProjectMainFeatureTrans } from "../models/projects/project_main_features";

export const getProjects = async () => {
    const projects = await Project.findAll({
        include: [
            {
                model: ProjectTrans,
                attributes: [
                    "name",
                    "desc",
                    "locale",
                    "slug",
                    "feature_title",
                    "feature_desc",
                    "main_feature_title",
                    "main_feature_desc",
                    "platform",
                    "location",
                    "about_title",
                    "about_desc",
                ],
            },
            {
                model: Feature,
                attributes: ["id", "image"],
                include: [
                    {
                        model: FeatureTranslation,
                        attributes: ["name", "desc", "locale"],
                    },
                ],
            },
        ],
        attributes: ["image", "downloads", "rating", "founded_in", "about_media", "about_media_type", "id"],
    });
    return projects;
};
export const getProjectsPaginated = async () => {
    const projects = await Project.findAndCountAll({
        include: [
            {
                model: ProjectTrans,
                attributes: [
                    "name",
                    "desc",
                    "locale",
                    "slug",
                    "feature_title",
                    "feature_desc",
                    "main_feature_title",
                    "main_feature_desc",
                    "platform",
                    "location",
                    "about_title",
                    "about_desc",
                ],
            },
            {
                model: Feature,
                attributes: ["id", "image"],
                include: [
                    {
                        model: FeatureTranslation,
                        attributes: ["name", "locale"],
                    },
                ],
            },
        ],
        attributes: ["image", "downloads", "rating", "founded_in", "about_media", "about_media_type", "id"],
        limit: 10,
        distinct: true,

    });
    return projects;
};

export const getProjectById = async (id: number) => {
    const project = await Project.findByPk(id, {
        include: [
            {
                model: ProjectTrans,
                attributes: [
                    "name",
                    "desc",
                    "locale",
                    "slug",
                    "feature_title",
                    "feature_desc",
                    "main_feature_title",
                    "main_feature_desc",
                    "platform",
                    "location",
                    "about_title",
                    "about_desc",
                ],
            },
            {
                model: Feature,
                attributes: ["id", "image"],
                include: [
                    {
                        model: FeatureTranslation,
                        attributes: ["name", "locale"],
                    },
                ],
            },
            {
                model: ProjectImage,
                attributes: ["id", "image"],
            },
        ],
        attributes: [
            "image",
            "downloads",
            "rating",
            "founded_in",
            "about_media",
            "about_media_type",
            "id",
        ],
    });
    return project;
};

export const getProjectFeature = async (project_id: number) => {
    const project = await ProjectFeature.findAll({
        where: {
            project_id,
        },
        include: [
            {
                model: ProjectFeatureTrans,
                attributes: ["name", "locale"],
            },
        ],
        attributes: [
            "icon",
            "id",
        ],
    });
    return project;
};
export const getProjectMainFeature = async (project_id: number) => {
    const project = await ProjectMainFeature.findAll({
        where: {
            project_id,
        },

        include: [
            {
                model: ProjectMainFeatureTrans,
                attributes: ["name", "locale"],
            },
        ],
        attributes: [
            "icon",
            "id",
        ],
    });
    return project;
};
export const getProjectImages = async (project_id: number) => {
    const project = await ProjectImage.findAll({
        where: {
            project_id,
        },
        attributes: [
            "image",
            "id",
        ],
    });
    return project;
};

export const getBySlug = async (slug: string, lang: string) => {
    const project = await Project.findOne({
        attributes: ['id'],
        include: {
            model: ProjectTrans,
            attributes: ["slug"],
            where: { slug: slug },
        }
    });

    if (!project) {
        return null;
    }



    const [projectData, projectMainFeatures, projectImages, projectFeatures] = await Promise.all([
        getProjectById(project.id),
        getProjectMainFeature(project.id),
        getProjectImages(project.id),
        getProjectFeature(project.id),
    ]);

    return {
        projectData,
        projectMainFeatures,
        projectImages,
        projectFeatures
    }

};
