import { Request, Response } from "express";
import { ResponseHandler } from "../../../utils/responseHandler";
import {
    SectionFeature,
    SectionFeatureTranslation,
} from "../../models/service_sections/sectionFeatures";
import {
    ServiceSections,
    ServiceSectionsTranslation,
} from "../../models/service_sections/sections";
import { Service, ServiceTranslate } from "../../models/services/services";
import {
    ServiceResource,
    SimpleServiceResource
} from "../../response/web/services";

// Handler to get a single service by its slug
export const getServiceBySlug = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const lang = req.headers["accept-language"] ?? "en";
        const slug = req.params.slug;
        const defaultService = await Service.findOne({
            attributes: ["id"],
            include: [
                {
                    model: ServiceTranslate,
                    where: { slug: slug },
                    attributes: ["id"],
                },
            ],
        });


        if (!defaultService) {
            ResponseHandler.error(res, "Service not found", 404);
            return;
        }
        const service = await Service.findByPk(defaultService.id, {
            attributes: ["id", "type", "icon", "background", "image", "video"],
            include: [
                {
                    model: ServiceTranslate,
                    where: { locale: req.headers["accept-language"] ?? "en" },
                    attributes: [
                        "title",
                        "desc",
                        "slug",
                        "name",
                        "sub_title",
                        "sub_desc",
                    ],
                },

                {
                    model: ServiceSections,
                    order: [
                        ['ordering', 'ASC']  //'ASC'  or 'DESC' for descending order
                    ],
                    include: [
                        {
                            model: ServiceSectionsTranslation,
                            attributes: ["title", "desc", "locale"],
                        },
                        {
                            model: SectionFeature,

                            include: [
                                {
                                    model: SectionFeatureTranslation,
                                    attributes: ["title", "desc", "locale"],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        if (!service) {
            ResponseHandler.error(res, "Service not found", 404);
            return;
        }



        ResponseHandler.success(res, ServiceResource.make(service, req, lang));
    } catch (error) {
        ResponseHandler.error(
            res,
            error instanceof Error
                ? error.message
                : "An error occurred while fetching the service",
            500
        );
    }
};

// Handler to get all services
export const getAllServices = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const services = await Service.findAll({
            include: [
                {
                    model: ServiceTranslate,
                    where: { locale: req.headers["accept-language"] ?? "en" },
                    attributes: ["name", "slug"],
                },
            ],

        });

        if (!services || services.length === 0) {
            ResponseHandler.error(res, "No services found", 404);
            return;
        }

        // Return the list of all services
        ResponseHandler.paginated(
            res,
            SimpleServiceResource.collection(services, req)
        );
    } catch (error) {
        // Handle unexpected errors
        console.error(error);
        ResponseHandler.error(
            res,
            "An error occurred while fetching the services",
            500
        );
    }
};
