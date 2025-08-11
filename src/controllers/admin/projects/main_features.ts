import { Request, Response } from "express";

import {
    ProjectImage,
    ProjectMainFeature
} from "../../../models/projects/project_main_features"
import { ResponseHandler } from "../../../../utils/responseHandler";
import { upsertImages, upsertMainProjectTrans, upsertProjectTrans } from "./helper/main_features";
import sequelize from "../../../../utils/database";
import { Project } from "../../../models/projects/project";
import { getProjectById, getProjectMainFeature } from "../../../services/projects";
import { ProjectResource } from "../../../response/projects";
import { MainFeatureResource } from "../../../response/projects/features";




export const createProjectMainFeature = async (req: Request, res: Response): Promise<void> => {
    const project_id = req.params.id as string
    const { ar, en, main_features, images } = req.body
    const transaction = await sequelize.transaction()
    try {
        const project = await Project.findByPk(+project_id, { transaction })

        if (!project) {
            ResponseHandler.error(res, "Project not found", 404)
            return
        }


        await Promise.all([
            upsertProjectTrans(+project_id, { ar }, transaction),
            upsertProjectTrans(+project_id, { en }, transaction),

            ...(Array.isArray(main_features)
                ? main_features.map(async (feature: any) => {
                    const { id, ar, en, icon } = feature;

                    let projectMainFeature: ProjectMainFeature;
                    if (id) {
                        const existing = await ProjectMainFeature.findByPk(id, { transaction });
                        if (existing) {
                            projectMainFeature = await existing.update({ ...(icon && { icon }) }, { transaction });
                        } else {
                            projectMainFeature = await ProjectMainFeature.create({ project_id: project.id, ...(icon && { icon }) }, { transaction });
                        }
                    } else {
                        projectMainFeature = await ProjectMainFeature.create({ project_id: project.id, ...(icon && { icon }) }, { transaction });
                    }

                    return Promise.all([
                        upsertMainProjectTrans(projectMainFeature.id, { ar }, transaction),
                        upsertMainProjectTrans(projectMainFeature.id, { en }, transaction),
                    ]);
                })
                : []),

            upsertImages(+project_id, images, transaction),
        ]);

        await transaction.commit()
        const project_data = await getProjectById(project.id)
        if (!project_data) {
            ResponseHandler.error(res, "Project not found", 404)
            return
        }

        const project_main_feature = await getProjectMainFeature(project.id)


        const project_data_response = await ProjectResource.make(
            project_data,
            req,
            {
                includeTranslations: true,
            }
        );
        const project_features = await MainFeatureResource.collection(project_main_feature, req, {
            includeTranslations: true,
        })
        const response = {
            main_features: project_features,
            ar: {

                main_feature_title: project_data_response?.ar?.main_feature_title || '',
                main_feature_desc: project_data_response?.ar?.main_feature_desc || ''
            },
            en: {
                main_feature_title: project_data_response?.en?.main_feature_title || '',
                main_feature_desc: project_data_response?.en?.main_feature_desc || ''
            }

        }

        ResponseHandler.success(res, response);

    } catch (error) {
        await transaction.rollback();
        if (error instanceof Error) {
            if (error.name === "SequelizeUniqueConstraintError") {
                if ("fields" in error) {
                    const sqlError = error as { fields: { [key: string]: string } };
                    const validtionError: string[] = [];
                    Object.keys(sqlError.fields).forEach((field) => {
                        validtionError.push(`${field} must be unique`);
                    });
                    ResponseHandler.error(res, validtionError[0], 422, validtionError);
                }
            } else {
                ResponseHandler.error(
                    res,
                    error instanceof Error ? error.message : "Failed to create Project"
                );
            }
        }
    }

}

export const deleteMainFeature = async (
    req: Request,
    res: Response
): Promise<void> => {
    const main_feature = await ProjectMainFeature.findByPk(req.params.id);
    if (!main_feature) {
        ResponseHandler.error(res, "Main feature not found", 422);
        return;
    }
    await main_feature
        .destroy()
        .then(() => ResponseHandler.deleted(res, "Feature deleted successfully"))
        .catch((error) =>
            ResponseHandler.error(res, error?.message || "unknown error", 500)
        );
};


export const deleteProjectImage = async (req: Request, res: Response) => {
    const project_image = await ProjectImage.findByPk(req.params.id);
    if (!project_image) {
        ResponseHandler.error(res, "Image not found", 422);
        return;
    }
    await project_image
        .destroy()
        .then(() => ResponseHandler.deleted(res, "Image deleted successfully"))
        .catch((error) =>
            ResponseHandler.error(res, error?.message || "unknown error", 500)
        );
};  
