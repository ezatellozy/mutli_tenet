import { Request, Response } from "express";
import { ResponseHandler } from "../../../utils/responseHandler";
import { Page, PageTranslations } from "../../models/pages";
import {
    HomeService,
    HomeServiceTranslation,
} from "../../models/services/home_services";
import { Service, ServiceTranslate } from "../../models/services/services";
import { HomeServiceResource } from "../../response/web/services";
import { About } from "../../models/about_us";
import { getAbout } from "../../services/about";
import { AboutResource } from "../../response/admin/about";

export const aboutRequest = async (
    req: Request,
    res: Response
): Promise<void> => {
    const lang = req.headers["accept-language"] ?? "en";

    try {
        const [pages, resService] = await Promise.all([
            Page.findAll({
                include: [
                    {
                        model: PageTranslations,
                        where: { locale: lang as string },
                        attributes: [
                            "title",
                            "content",
                            "name",
                            "button_name",
                            "sub_title",
                            "locale",
                        ],
                    },
                ],
                attributes: ["id", "image", "video", "icon", "type"],
            }),
            HomeService.findAll({
                include: [
                    {
                        model: HomeServiceTranslation,
                        where: { locale: lang as string },
                        attributes: ["title", "desc"],
                    },
                    {
                        model: Service,
                        include: [
                            {
                                model: ServiceTranslate,
                                attributes: ["slug"],
                                where: {
                                    locale: lang,
                                },
                            },
                        ],
                    },
                ],
                attributes: ["id", "icon", "color", "service_id"],
            }),

        ]);


        const visionsTypes = new Set(["message", "mission", "vision"]);

        const visions: Record<string, any> = {};


        pages.map((page) => {
            const { PageTranslations, video, image, type, id } = page.toJSON();
            const transaction = PageTranslations
                ? PageTranslations[0]
                : {
                    name: "",
                    content: "",
                    title: "",
                    button_name: "",
                };

            const imageUrl = image
                ? `${req.protocol}://${req.get("host")}/images/pages/${image.replace(
                    /\\/g,
                    "/"
                )}`
                : "";

            if (visionsTypes.has(type)) {
                visions[type] = {
                    image: imageUrl,
                    title: transaction?.title || "",
                    name: transaction?.name || "",

                    content: transaction?.content || "",
                    id,
                };
            }
        });


        const about = await getAbout();

        const services = HomeServiceResource.collection(resService, req).data;

        const response = {
            ...visions,
            services,
            about: about ? AboutResource.make(about, req, {}) : null
        };

        ResponseHandler.success(res, response);
    } catch (err) {
        if (err instanceof Error) {
            ResponseHandler.error(res, err.message || "Unknown erro", 500);
        } else {
            ResponseHandler.error(res, "Unknown erro", 500);
        }
    }
};
