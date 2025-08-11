import { Model, Optional, DataTypes, HasManyGetAssociationsMixin } from "sequelize"
import sequelize from "../../utils/database"

interface TitleAttributes {
    id: number
    section: string
}

interface TitleCreatitionAttributes extends Optional<TitleAttributes, 'id'> { }

interface TitleTranslationAttributes {
    id: number
    title_id: number
    locale: string
    title: string
    desc: string
}

interface TitleTranslationCreatitionAttributes extends Optional<TitleTranslationAttributes, 'id'> { }

class Title extends Model<TitleAttributes, TitleCreatitionAttributes> implements TitleAttributes {
    declare id: number
    declare section: string
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
    declare TitleTranslation: TitleTranslation[]
    declare getTitleTranslations: HasManyGetAssociationsMixin<TitleTranslation>
}

Title.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        section: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }
    , {
        sequelize,
        modelName: 'Title',

        timestamps: false,
        paranoid: false,
        underscored: true

    }
)

class TitleTranslation extends Model<TitleTranslationAttributes, TitleTranslationCreatitionAttributes> implements TitleTranslationAttributes {
    declare id: number
    declare title_id: number
    declare locale: string
    declare title: string
    declare desc: string
    declare readonly createdAt: Date
    declare readonly updatedAt: Date

}

TitleTranslation.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Title,
            key: 'id'
        },
        allowNull: false
    },
    locale: {
        type: DataTypes.STRING(5),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    desc: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'TitleTranslation',
    underscored: true
})


export const titlesAssociations = () => {
    Title.hasMany(TitleTranslation, { foreignKey: 'title_id', onDelete: 'CASCADE' });
    TitleTranslation.belongsTo(Title, { foreignKey: 'title_id' });
}


