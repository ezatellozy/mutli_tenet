import { Optional, Model, DataTypes } from "sequelize";
import sequelize from "../../../utils/database";

interface ProjectMainFeatureAttrs {
    id: number
    project_id: number
    icon: string
}

interface ProjectMainFeatureCreationAttrs extends Optional<ProjectMainFeatureAttrs, "id"> { }

class ProjectMainFeature
    extends Model<ProjectMainFeatureAttrs, Optional<ProjectMainFeatureCreationAttrs, "id">>
    implements ProjectMainFeatureAttrs {
    declare id: number;
    declare icon: string;
    declare project_id: number;
}

ProjectMainFeature.init(
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
        modelName: "project_main_feature",
        indexes: [
            {
                fields: ['project_id'],
            }
        ]
    }
)


interface ProjectMainFeatureTransAttrs {
    id: number
    project_main_feature_id: number
    name: string
    locale: string
}

interface ProjectMainFeatureTransCreationAttrs extends Optional<ProjectMainFeatureTransAttrs, "id"> { }

class ProjectMainFeatureTrans
    extends Model<ProjectMainFeatureTransAttrs, ProjectMainFeatureTransCreationAttrs>
    implements ProjectMainFeatureTransAttrs {
    declare id: number;
    declare project_main_feature_id: number;
    declare name: string;
    declare locale: string;

}

ProjectMainFeatureTrans.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        project_main_feature_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        locale: {
            type: DataTypes.STRING,
            allowNull: false,
        },

    },
    {
        sequelize,
        modelName: "project_main_feature_translation",
        indexes: [
            {
                fields: ['project_main_feature_id'],
            }
        ]
    }
)


interface ProjectImageAttrs {
    id: number
    project_id: number
    image: string
}

interface ProjectImageCreationAttrs extends Optional<ProjectImageAttrs, "id"> { }

class ProjectImage
    extends Model<ProjectImageAttrs, ProjectImageCreationAttrs>
    implements ProjectImageAttrs {
    declare id: number;
    declare project_id: number;
    declare image: string;
}

ProjectImage.init(
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
        image: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
    {
        sequelize,
        modelName: "project_image",
        indexes: [
            {
                fields: ['project_id'],
            }
        ]
    }
)


export { ProjectMainFeature, ProjectMainFeatureTrans, ProjectImage }












