import { DataTypes, HasManyGetAssociationsMixin, Model, Optional } from "sequelize";
import sequelize from "../../../utils/database";
import { Service } from "../services/services";
import { SectionFeature, SectionFeatureTranslation } from "./sectionFeatures";


interface SectionsAttr {
    id: number
    ordering: number
    image: string
    video: string
    background: string
    type: string
    service_id: number
    service_section_translations?: ServiceSectionsTranslation[]
    // section_features?: SectionFeature[]
}
interface SectionsCreationAttributes extends Optional<SectionsAttr, 'id'> { }

interface SectionsTransAttr {
    id: number
    title: string
    desc?: string
    locale: string
    service_section_id: number
}

interface SectionsTransCreationAttributes extends Optional<SectionsTransAttr, 'id'> { }

class ServiceSections extends Model<SectionsAttr, Optional<SectionsCreationAttributes, 'id' | 'ordering'>> implements SectionsAttr {
    declare id: number;
    declare ordering: number;
    declare type: string;
    declare image: string;
    declare video: string;
    declare background: string;
    declare service_id: number;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
    declare service_section_translations: ServiceSectionsTranslation[];
    declare get_service_section_translations: HasManyGetAssociationsMixin<ServiceSectionsTranslation>
}


class ServiceSectionsTranslation extends Model<SectionsTransAttr, SectionsTransCreationAttributes> implements SectionsTransAttr {
    declare id: number;
    declare title: string;
    declare desc: string;
    declare locale: string;
    declare service_section_id: number;
}


ServiceSections.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    ordering: {
        type: DataTypes.INTEGER,
        allowNull: true

    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    video: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    background: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize,
    underscored: true,
    modelName: 'service_section'
})


ServiceSectionsTranslation.init({
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
    service_section_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize,
    underscored: true,
    modelName: 'service_section_translation'
})



export const applySectionAssociations = () => {
    ServiceSections.hasMany(ServiceSectionsTranslation, { foreignKey: 'service_section_id', onDelete: 'CASCADE' })
    ServiceSectionsTranslation.belongsTo(ServiceSections, { foreignKey: 'service_section_id' })
    Service.hasMany(ServiceSections, { foreignKey: 'service_id', onDelete: 'CASCADE' })
    ServiceSections.belongsTo(Service, { foreignKey: 'service_id' })
    ServiceSections.hasMany(SectionFeature, { foreignKey: 'service_section_id', onDelete: 'CASCADE' })
    SectionFeature.hasMany(SectionFeatureTranslation, { foreignKey: 'feature_id', onDelete: 'CASCADE' })
    SectionFeatureTranslation.belongsTo(SectionFeature, { foreignKey: 'feature_id', onDelete: 'CASCADE' })
    SectionFeature.belongsTo(ServiceSections, { foreignKey: 'service_section_id', onDelete: 'CASCADE' })
}


export { ServiceSections, ServiceSectionsTranslation };

