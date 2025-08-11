import { DataTypes, HasManyGetAssociationsMixin, Model, Optional } from "sequelize"
import sequelize from "../../../utils/database"


interface SectionFeatureAttrs {
    id: number,
    icon?: string,
    section_feature_translations?: SectionFeatureTransAttrs[]
}

interface SectionFeatureCreationAttributes extends Optional<SectionFeatureAttrs, 'id'> { }

interface SectionFeatureTransAttrs {
    id: number,
    title: string,
    desc?: string,
    feature_id: number,
    locale: string
}

interface FeatureTransCreationAttributes extends Optional<SectionFeatureTransAttrs, 'id'> { }


class SectionFeature extends Model<SectionFeatureAttrs, Optional<SectionFeatureCreationAttributes, 'id'>> implements SectionFeatureAttrs {
    declare id: number
    declare icon: string
    declare readonly created_at: Date
    declare readonly updated_at: Date
    declare get_section_feature_translations: HasManyGetAssociationsMixin<SectionFeatureTransAttrs>
    declare section_feature_translations: SectionFeatureTransAttrs[]
}

SectionFeature.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true,
        },

    },
    {
        sequelize,
        modelName: 'section_feature',
        underscored: true,
    }
)

class SectionFeatureTranslation extends Model<SectionFeatureTransAttrs, Optional<FeatureTransCreationAttributes, 'id'>> implements SectionFeatureTransAttrs {
    declare id: number
    declare title: string
    declare desc: string
    declare locale: string
    declare feature_id: number
    declare readonly created_at: Date
    declare readonly updated_at: Date

}

SectionFeatureTranslation.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        locale: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        feature_id: {
            type: DataTypes.INTEGER,
            references: {
                model: SectionFeature,
                key: 'id',
            },
            allowNull: false,
        }
    },
    {
        sequelize,
        modelName: 'section_feature_translation',
        underscored: true,
    }
)




export { SectionFeature, SectionFeatureTranslation }



