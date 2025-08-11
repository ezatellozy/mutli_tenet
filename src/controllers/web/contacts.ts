import { ResponseHandler } from "../../../utils/responseHandler";
import Contacts from "../../models/contacts";
import NewsLetter from "../../models/news_letters";
import { Request, Response } from "express"


export const createContact = async (req: Request, res: Response): Promise<void> => {


    try {
        const { name, email, phone, message, subject } = req.body;

        const contacts = await Contacts.create({ name, email, phone, message, subject });
        ResponseHandler.success(res, contacts.get(), 'Message send successfully')
    } catch (err) {
        res.status(422).json({ message: "Invalid request data" });
        return;
    }

}
export const createNews = async (req: Request, res: Response): Promise<void> => {


    try {
        const { email } = req.body;
        const news = await NewsLetter.create({ email });
        ResponseHandler.success(res, news.get(), 'Subscribe successfully')
    } catch (err) {
        res.status(422).json({ message: "Invalid request data" });
        return;
    }

}