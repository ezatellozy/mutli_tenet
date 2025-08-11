import { Optional, Model, DataTypes } from "sequelize";
import sequelize from "../../../utils/database";

interface ProjectFeatureAttrs {
    id: number
    project_id: number
    icon: string

}

interface ProjectFeatureCreationAttrs extends Optional<ProjectFeatureAttrs, "id"> { }

class ProjectFeature
    extends Model<ProjectFeatureAttrs, ProjectFeatureCreationAttrs>
    implements ProjectFeatureAttrs {
    declare id: number;
    declare project_id: number;
    declare icon: string
}

ProjectFeature.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
    {
        sequelize,
        modelName: "project_feature",
        indexes: [
            {
                fields: ['project_id'],
            }
        ]
    }
)


interface ProjectFeatureTransAttrs {
    id: number
    project_feature_id: number
    name: string
    desc?: string
    locale: string
}

interface ProjectFeatureTransCreationAttrs extends Optional<ProjectFeatureTransAttrs, "id"> { }

class ProjectFeatureTrans
    extends Model<ProjectFeatureTransAttrs, ProjectFeatureTransCreationAttrs>
    implements ProjectFeatureTransAttrs {
    declare id: number;
    declare project_feature_id: number;
    declare name: string;
    declare desc: string;
    declare locale: string;
}

ProjectFeatureTrans.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        project_feature_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        desc: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        locale: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
    {
        sequelize,
        modelName: "project_feature_translation",
        indexes: [
            {
                fields: ['project_feature_id'],
            }
        ]
    }
)






export { ProjectFeature, ProjectFeatureTrans }












