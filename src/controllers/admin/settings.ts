import { Request, Response } from "express"
// import sequelize from "../../../utils/database"
import { ResponseHandler } from "../../../utils/responseHandler"
import Settings from "../../models/settings"

export const createSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ...keys } = req.body;

        for (const [key, value] of (<any>Object).entries(keys)) {
            const setting = await Settings.findOne({ where: { key } });

            if (setting) {
                await setting.update({ value });
            } else {
                await Settings.create({ key, value });
            }
        }

        const allSettings = await Settings.findAll();
        const response = allSettings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as Record<string, string | number>);


        ResponseHandler.success(res, response);
    } catch (error) {
        if (error instanceof Error) {
            ResponseHandler.error(res, error.message ?? "Failed to create or update settings", 500);
        } else {
            ResponseHandler.error(res, "Failed to create or update settings", 500);
        }
    }
};


export const settingIndex = async (req: Request, res: Response): Promise<void> => {
    try {
        const allSettings = await Settings.findAll();
        // const response = allSettings.reduce((acc, setting) => {
        //     acc[setting.key] = setting.value;
        //     return acc;
        // }, {} as Record<string, string | number>);

        ResponseHandler.success(res, allSettings);
    } catch (error) {
        if (error instanceof Error) {
            ResponseHandler.error(res, error.message ?? "Failed to fetch settings", 500);
        } else {
            ResponseHandler.error(res, "Failed to fetch settings", 500);
        }
    }
}