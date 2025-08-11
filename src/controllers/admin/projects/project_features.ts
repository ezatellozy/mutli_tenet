import { Request, Response } from "express";

import {
    ProjectFeature
} from "../../../models/projects/project_features"
import { ResponseHandler } from "../../../../utils/responseHandler";
import { upsertFeatureTrans, upsertProjectTrans } from "./helper/project_features";
import sequelize from "../../../../utils/database";
import { Project } from "../../../models/projects/project";
import { getProjectById, getProjectFeature } from "../../../services/projects";
import { ProjectResource } from "../../../response/projects";
import { ProjectFeatureResource } from "../../../response/projects/features";



const handleFeature = async (feature: any, project_id: number, transaction: any) => {
    const { id, ar, en, icon } = feature;
    let projectFeature: ProjectFeature;

    try {
        // Check if feature exists and fetch or create a new one
        if (id) {
            const existing = await ProjectFeature.findByPk(id, { transaction });
            if (existing) {
                projectFeature = existing;
            } else {
                projectFeature = await ProjectFeature.create({ project_id: project_id, ...(icon && { icon }) }, { transaction });
            }
        } else {
            projectFeature = await ProjectFeature.create({ project_id: project_id, ...(icon && { icon }) }, { transaction });
        }

        // Update translations for both AR and EN
        await Promise.all([
            upsertFeatureTrans(projectFeature.id, { ar }, transaction),
            upsertFeatureTrans(projectFeature.id, { en }, transaction),
        ]);
    } catch (error) {
        console.error('Error handling feature:', error);
        throw error;  // Rethrow to ensure transaction can be rolled back
    }
};

export const createProjectFeature = async (req: Request, res: Response): Promise<void> => {
    const project_id = req.params.id as string
    const { ar, en, features } = req.body
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
        ]);


        for (const feature of features) {
            await handleFeature(feature, +project_id, transaction)
        }
        await transaction.commit()
        const project_data = await getProjectById(project.id)
        const project_feature = await getProjectFeature(project.id)
        if (!project_data) {
            ResponseHandler.error(res, "Project not found", 404)
            return
        }

        const project_data_response = await ProjectResource.make(
            project_data,
            req,
            {
                includeTranslations: true,
            }
        );
        const project_features = await ProjectFeatureResource.collection(project_feature, req, {
            includeTranslations: true,
        })
        const response = {
            project_features,
            ar: {

                feature_title: project_data_response?.ar?.feature_title || '',
                feature_desc: project_data_response?.ar?.feature_desc || ''
            },
            en: {
                feature_title: project_data_response?.en?.feature_title || '',
                feature_desc: project_data_response?.en?.feature_desc || ''
            }

        }

        ResponseHandler.success(
            res,
            response
        );

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

