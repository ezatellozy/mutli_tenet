import { Optional, Model, DataTypes, HasManyAddAssociationMixin, HasManyGetAssociationsMixin, HasManyRemoveAssociationMixin, HasManySetAssociationsMixin } from "sequelize";
import sequelize from "../../../utils/database";
import { ProjectFeature, ProjectFeatureTrans } from "./project_features";
import { ProjectMainFeature, ProjectMainFeatureTrans, ProjectImage } from "./project_main_features";
import { Feature } from "../features";

interface ProjectAttrs {
    id: number;
    image: string;
    downloads?: number;
    rating?: number;
    founded_in: string
    about_media: string
    about_media_type: string
    Features?: Feature[]
    project_main_features?: ProjectMainFeature[]
}

interface ProjectCreationAttrs extends Optional<ProjectAttrs, "id"> { }

class Project
    extends Model<ProjectAttrs, ProjectCreationAttrs>
    implements ProjectAttrs {
    declare id: number;
    declare image: string;
    declare about_media: string;
    declare about_media_type: string;
    declare founded_in: string;
    declare downloads: number;
    declare rating: number;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;

    // Add type declarations for association methods
    declare addFeature: HasManyAddAssociationMixin<Feature, number>;
    declare addFeatures: HasManyAddAssociationMixin<Feature, number[]>;
    declare removeFeature: HasManyRemoveAssociationMixin<Feature, number>;
    declare removeFeatures: HasManyRemoveAssociationMixin<Feature, number[]>;
    declare setFeatures: HasManySetAssociationsMixin<Feature, number[]>;
    declare getFeatures: HasManyGetAssociationsMixin<Feature[]>;
    declare project_translations: ProjectTrans[];
    declare Features: Feature[]
    declare project_main_features: ProjectMainFeature[]


}

Project.init(
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
        about_media: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        about_media_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        founded_in: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        downloads: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "project",
        underscored: true,

    }
);


interface ProjectTransAttrs {
    id: number
    name: string
    desc: string
    main_feature_title?: string
    main_feature_desc?: string
    feature_title?: string
    feature_desc?: string
    platform: string
    location: string
    about_title: string
    about_desc: string
    locale: string
    project_id: number
    slug: string


}


interface ProjectTransCreationAttrs extends Optional<ProjectTransAttrs, 'id' | 'slug'> { }

class ProjectTrans
    extends Model<ProjectTransAttrs, ProjectTransCreationAttrs>
    implements ProjectTransAttrs {
    declare id: number;
    declare name: string;
    declare desc: string;
    declare platform: string;
    declare location: string;
    declare about_title: string;
    declare about_desc: string;
    declare feature_title: string;
    declare feature_desc: string;
    declare main_feature_title: string;
    declare main_feature_desc: string;
    declare locale: string;
    declare project_id: number;
    declare slug: string;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

ProjectTrans.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        desc: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        platform: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        about_title: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        about_desc: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        feature_title: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        feature_desc: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        main_feature_title: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        main_feature_desc: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        locale: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },



    },
    {
        sequelize,
        modelName: "project_translation",
        underscored: true,
        indexes: [
            {
                fields: ['project_id'],
            }
        ]

    }

)



export const ProjectRelations = () => {
    Project.hasMany(ProjectTrans, { foreignKey: "project_id" })
    ProjectTrans.belongsTo(Project, { foreignKey: "project_id" })

    Project.hasMany(ProjectImage, { foreignKey: "project_id" })
    ProjectImage.belongsTo(Project, { foreignKey: "project_id" })

    Project.hasMany(ProjectFeature, { foreignKey: "project_id" })
    ProjectFeature.belongsTo(Project, { foreignKey: "project_id" })



    ProjectFeature.hasMany(ProjectFeatureTrans, { foreignKey: "project_feature_id" })
    ProjectFeatureTrans.belongsTo(ProjectFeature, { foreignKey: "project_feature_id" })

    Project.hasMany(ProjectMainFeature, { foreignKey: "project_id" })
    ProjectMainFeature.belongsTo(Project, { foreignKey: "project_id" })



    ProjectMainFeature.hasMany(ProjectMainFeatureTrans, { foreignKey: "project_main_feature_id" })
    ProjectMainFeatureTrans.belongsTo(ProjectMainFeature, { foreignKey: "project_main_feature_id" })

    // Many-to-many relationship with Feature
    Project.belongsToMany(Feature, {
        through: 'project_tools',
        foreignKey: 'project_id',
        otherKey: 'feature_id',

    });
    Feature.belongsToMany(Project, {
        through: 'project_tools',
        foreignKey: 'feature_id',
        otherKey: 'project_id'
    });
}


export { ProjectTrans, Project }
