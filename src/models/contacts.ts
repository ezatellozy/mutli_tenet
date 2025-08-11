import { DataTypes, Optional, Model } from "sequelize";
import sequelize from "../../utils/database";

interface ContactsAttrs {
    id: number;
    name: string;
    email: string;
    phone: string;
    subject: string
    message: string;
}


interface ContactsCreationAttrs extends Optional<ContactsAttrs, 'id'> { }

class Contacts extends Model<ContactsAttrs, Optional<ContactsCreationAttrs, 'id'>> implements ContactsAttrs {
    declare id: number
    declare name: string
    declare email: string
    declare phone: string
    declare subject: string
    declare message: string
}

Contacts.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: DataTypes.STRING,
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    subject: DataTypes.STRING,
    message: DataTypes.STRING,

}, {
    sequelize,
    modelName: "contact",
    underscored: true,
})


export default Contacts