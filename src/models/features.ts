import {
    DataTypes,
    HasManyGetAssociationsMixin,
    Model,
    Optional,
} from "sequelize";
import sequelize from "../../utils/database";

interface FeatureAttributes {
    id: number;

    image: string;
    type: "features" | "partners" | "technology";
    FeatureTranslations?: FeatureTranslationAttrs[]

}

interface FeatureCreationAttributes
    extends Optional<FeatureAttributes, "id" | "type"> { }

class Feature
    extends Model<FeatureAttributes, Optional<FeatureCreationAttributes, 'id' | 'type'>>
    implements FeatureAttributes {
    declare id: number;
    declare image: string;
    declare type: "features" | "partners" | "technology";
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    declare getFeatureTranslations: HasManyGetAssociationsMixin<FeatureTranslationAttrs>;
    declare FeatureTranslations: FeatureTranslationAttrs[];
}

Feature.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("features", "partners", "technology"),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: "Feature",
        paranoid: false,
        underscored: true,
        getterMethods: {
            getFeatureTranslations: async function () {
                const feature = await Feature.findByPk(this.id)
                return feature ? await FeatureTranslation.findAll({ where: { feature_id: this.id } }) : []
            }
        },

        scopes: {
            features: {
                where: { type: "features" },
            },
            partners: {
                where: { type: "partners" },
            },
        },
    }
);

interface FeatureTranslationAttrs {
    id: number;
    feature_id: number;
    locale: string;
    name: string;
    desc: string;
}

interface FeatureTranslationCreationAttributes
    extends Optional<FeatureTranslationAttrs, "id"> { }

class FeatureTranslation
    extends Model<FeatureTranslationAttrs, Optional<FeatureTranslationCreationAttributes, 'id'>>
    implements FeatureTranslationAttrs {
    declare id: number;
    declare feature_id: number;
    declare locale: string;
    declare name: string;
    declare desc: string;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
}

FeatureTranslation.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        feature_id: {
            type: DataTypes.INTEGER,
            references: {
                model: Feature,
                key: "id",
            },
            allowNull: false,
        },
        locale: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "FeatureTranslation",
        paranoid: false,
        underscored: true,
    }
);



export const featuresAssociations = () => {
    Feature.hasMany(FeatureTranslation, { foreignKey: 'feature_id', onDelete: 'CASCADE' });
    FeatureTranslation.belongsTo(Feature, { foreignKey: 'feature_id' });
}

export { Feature, FeatureTranslation }