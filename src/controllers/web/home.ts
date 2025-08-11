import { Request, Response } from "express";
import { Page, PageTranslations } from "../../models/pages";
import { Feature, FeatureTranslation } from "../../models/features";
import { ResponseHandler } from "../../../utils/responseHandler";
import { HomeService, HomeServiceTranslation } from "../../models/services/home_services";
import { HomeServiceResource } from "../../response/web/services";
import { Service, ServiceTranslate } from "../../models/services/services";

export const homeRequest = async (
    req: Request,
    res: Response
): Promise<void> => {
    const lang = req.headers["accept-language"] ?? "en";

    try {
        const [pages, allFeatures, resService] = await Promise.all([
            Page.findAll({
                include: [
                    {
                        model: PageTranslations,
                        where: { locale: lang as string },
                        attributes: ["title", "content", "name", "button_name", "sub_title"],
                    },
                ],
                attributes: ["id", "image", "video", "icon", "type"],
            }),
            Feature.findAll({
                include: [
                    {
                        model: FeatureTranslation,
                        where: { locale: lang as string },
                        attributes: ["name", "desc"],
                    },
                ],
                attributes: ["id", "image", "type"],
            }),
            HomeService.findAll({
                include: [{
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
                },],
                attributes: ["id", "icon", "color", 'service_id'],
            })
        ]);


        const visionsTypes = new Set(["message", "mission", "vision"]);

        const visions: Array<{
            image: string;
            title: string;
            name?: string;
            content: string;
            sub_title?: string;
            button_name?: string
            id: number
        }> = [];

        let top_intro: Record<string, string | number> = {};
        let middle_intro: Record<string, string | number> = {};




        pages.map((page) => {
            const { PageTranslations, video, image, type, id } = page.toJSON()
            const transaction = PageTranslations ? PageTranslations[0] : {
                name: '',
                content: '',
                title: '',
                button_name: ''

            };

            const imageUrl = image ? `${req.protocol}://${req.get("host")}/images/pages/${image.replace(/\\/g, "/")}` : "";
            const videoUrl = video ? `${req.protocol}://${req.get("host")}/files/pages/${video.replace(/\\/g, "/")}` : "";

            if (visionsTypes.has(type)) {
                visions.push({
                    image: imageUrl,
                    title: transaction?.title || "",
                    name: transaction?.name || "",

                    content: transaction?.content || "",
                    id
                });
            }
            if (type === "top_intro") {
                top_intro = {
                    title: transaction?.title || "",
                    content: transaction?.content || "",
                };
            }
            if (type === "middle_intro") {
                middle_intro = {
                    title: transaction?.title || "",
                    content: transaction?.content || "",
                    button_name: transaction?.button_name || "",
                    video: videoUrl,
                    id
                };
            }
        });



        const services = HomeServiceResource.collection(resService, req).data;





        const featureRes = allFeatures.reduce<Record<string, Array<{ name: string, desc?: string, image?: string, id: number }>>>((acc, cFeature) => {
            const { FeatureTranslations, image, type, id } = cFeature.toJSON();

            const translation = FeatureTranslations?.[0] || { name: "", desc: "" };

            if (!acc[type]) acc[type] = [];


            acc[type].push({
                id,
                image: image ? `${req.protocol}://${req.get("host")}/images/features/${image.replace(/\\/g, "/")}` : "",
                ...translation,
            });

            return acc;
        }, {});



        const response = {
            visions,
            top_intro,
            middle_intro,
            services,
            ...featureRes
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
