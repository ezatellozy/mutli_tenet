import { Request, Response } from "express";
import { ResponseHandler } from "../../../utils/responseHandler";
import { ProjectResource } from "../../response/projects";
import { getBySlug, getProjectsPaginated } from "../../services/projects";
import { MainFeatureResource, ProjectFeatureResource, ProjectImagesResource } from "../../response/projects/features";



export const getProjectBySlug = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const lang = req.headers["accept-language"] ?? "en";
        const slug = req.params.slug;
        const project = await getBySlug(slug, lang)


        if (!project?.projectData) {
            ResponseHandler.error(res, "project not found", 404);
            return;
        }


        const [project_respose, features, main_features, project_images] =
            await Promise.all([
                ProjectResource.make(project.projectData, req, {
                    includeTranslations: false,
                    includeTools: true,
                }),
                ProjectFeatureResource.collection(project.projectFeatures, req),
                MainFeatureResource.collection(project.projectMainFeatures, req),
                ProjectImagesResource.collection(project.projectImages, req),
            ]);


        const response = {
            ...project_respose,
            features,
            main_features,
            project_images
        }


        ResponseHandler.success(res, response);
    } catch (error) {
        ResponseHandler.error(
            res,
            error instanceof Error
                ? error.message
                : "An error occurred while fetching the project",
            500
        );
    }
};


export const getAllProjects = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const current_page = req.query.page
            ? parseInt(req.query.page as string)
            : 1;

        const projects = await getProjectsPaginated()
        ResponseHandler.paginated(
            res,
            await ProjectResource.collectionWithPagination(projects, req, {

                includeTools: true
            }, current_page, 5)
        );
    } catch (error) {
        // Handle unexpected errors
        console.error(error);
        ResponseHandler.error(
            res,
            "An error occurred while fetching the projects",
            500
        );
    }
};
