import { Request, Response } from "express";
import sequelize from "../../../../utils/database";
import { ResponseHandler } from "../../../../utils/responseHandler";
import { Feature } from "../../../models/features";
import { Project } from "../../../models/projects/project";
import { ProjectResource } from "../../../response/projects";
import { getProjectById } from "../../../services/projects";
import { upsertProjectTrans } from "./helper/main_data";

export const createProject = async (req: Request, res: Response): Promise<void> => {
    const { ar, en, downloads, rating, tools, founded_in, image, about_media, about_media_type } = req.body;
    const transaction = await sequelize.transaction();
    const errors: string[] = []

    if (!image) {
        errors.push("Image is required")
    }

    if (!about_media) {
        errors.push("About image is required")
    }

    if (!about_media_type) {
        errors.push("About media type is required")
    }


    if (!founded_in) {
        errors.push("Founded in is required")
    }

    if (errors.length > 0) {
        ResponseHandler.error(res, errors[0], 422, errors)
        return
    }


    try {
        const project = await Project.create({ ...(downloads && { downloads }), ...(rating && { rating }), founded_in, image, about_media, about_media_type }, { transaction });

        // Create translations
        await upsertProjectTrans(project.id, { ar }, transaction);
        await upsertProjectTrans(project.id, { en }, transaction);

        // Add tools if provided
        if (tools && tools.length > 0) {
            const setTools = new Set<number>(tools)
            const uniqueTools = Array.from<number>(setTools).filter(Boolean)
            const errors: string[] = []

            await Promise.all(uniqueTools.map(async (tool: number) => {
                if (errors.length) {
                    return
                }
                const feature = await Feature.findByPk(tool)

                if (!feature) {
                    errors.push(`Tool ${tool} not found`)
                }
            }));

            if (errors.length > 0) {
                ResponseHandler.error(res, errors[0], 404)
                await transaction.rollback();
                return
            } else {
                await project.addFeatures(uniqueTools, { transaction });
            }
        }
        await transaction.commit();



        const project_data = await getProjectById(project.id)
        if (!project_data) {
            ResponseHandler.error(res, "Project not found", 404)
            return
        }

        ResponseHandler.success(res, await ProjectResource.make(project_data, req, {
            includeTools: true,
            includeTranslations: true
        }));
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
export const updateCreateProject = async (req: Request, res: Response): Promise<void> => {
    const project_id = req.params.id as string
    const { ar, en, downloads, rating, tools, founded_in, image, about_media, about_media_type } = req.body;
    const transaction = await sequelize.transaction();



    try {

        const project = await Project.findByPk(project_id)

        if (!project) {
            await transaction.rollback();
            ResponseHandler.error(res, "Project not found", 404)
            return
        }

        await project.update({
            ...(downloads && { downloads }),
            ...(rating && { rating }),
            ...(founded_in && { founded_in }),
            ...(image && { image }),
            ...(about_media && { about_media }),
            ...(about_media_type && { about_media_type })
        }, { transaction });


        await Promise.all([
            upsertProjectTrans(project.id, { ar }, transaction),
            upsertProjectTrans(project.id, { en }, transaction),
        ]);


        const features = await project.getFeatures()



        // Add tools if provided
        if (Array.isArray(tools) && tools.length > 0) {

            const setTools = new Set<number>(tools)
            const uniqueTools = Array.from<number>(setTools).filter(Boolean)

            const invalidTools = await Promise.all(
                uniqueTools.map(async (toolId) => {
                    const exists = await Feature.findByPk(toolId);
                    return exists ? null : toolId;
                })
            );

            const missingTools = invalidTools.filter(Boolean);
            if (missingTools.length > 0) {
                await transaction.rollback();
                ResponseHandler.error(res, `Tool ${missingTools[0]} not found`, 404);
                return
            }
            const featureInstances = await Feature.findAll({
                where: {
                    id: uniqueTools,
                }
            });
            await project.setFeatures(featureInstances, { transaction });
        }
        await transaction.commit();


        const project_data = await getProjectById(project.id)
        if (!project_data) {
            ResponseHandler.error(res, "Project not found", 404)
            return
        }

        ResponseHandler.success(res, await ProjectResource.make(project_data, req, {
            includeTranslations: true,
            includeTools: true
        }));
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


