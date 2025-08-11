import { DataTypes, Optional, Model } from "sequelize"
import sequelize from "../../../utils/database"


interface metaAttrs {
    id: number
    meta_key: string

}

interface metaCreationAttrs extends Optional<metaAttrs, 'id' | 'meta_key'> { }

class MetaData extends Model<metaAttrs, metaCreationAttrs> implements metaAttrs {
    declare id: number
    declare meta_key: string
}

MetaData.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        meta_key: DataTypes.STRING,
    },
    {
        sequelize,
        modelName: "meta_data",
        underscored: true,
    }
)


export { MetaData }