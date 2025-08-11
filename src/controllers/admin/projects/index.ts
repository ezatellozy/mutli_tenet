import { Request, Response } from "express"
import { ResponseHandler } from "../../../../utils/responseHandler"
import { ProjectResource } from "../../../response/projects"
import { getProjectById, getProjectFeature, getProjectImages, getProjectMainFeature, getProjectsPaginated } from "../../../services/projects"
import { MainFeatureResource, ProjectFeatureResource, ProjectImagesResource } from "../../../response/projects/features"

export const getIndexProjects = async (req: Request, res: Response): Promise<void> => {
    const { page, per_page } = req.query
    const projects = await getProjectsPaginated()


    if (!projects) {
        ResponseHandler.success(res, await ProjectResource.collection([], req, {}))
        return
    }
    ResponseHandler.paginated(res, await ProjectResource.collectionWithPagination(projects, req, {}, page ? +page : 1, per_page ? +per_page : 10))
}


export const getProject = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params
    const project = await getProjectById(Number(id))

    if (!project) {
        ResponseHandler.error(res, 'Project not found', 404)
        return
    }

    const [project_data, project_feature, project_images_response, project_main_feature] = await Promise.all([

        ProjectResource.make(project, req, {
            includeTranslations: true,
            includeTools: true,
        }),
        getProjectFeature(project.id),
        getProjectImages(project.id),
        getProjectMainFeature(project.id),
    ]);


    const [project_features, project_main_features, project_images] = await Promise.all([
        ProjectFeatureResource.collection(project_feature, req, {
            includeTranslations: true,
        }),
        MainFeatureResource.collection(project_main_feature, req, {
            includeTranslations: true,
        }),
        ProjectImagesResource.collection(project_images_response, req),
    ]);


    const response = {
        ...project_data,
        main_features: project_main_features,
        project_features,
        project_images,
    };



    ResponseHandler.success(res, response)
}

