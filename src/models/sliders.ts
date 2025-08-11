import {
    Optional, HasManyGetAssociationsMixin, DataTypes,
    Model
} from "sequelize"

import sequelize from "../../utils/database"


interface SliderAttributes {
    id: number
    media: string
    media_type: string
}
interface SliderCreatitionAttributes extends Optional<SliderAttributes, 'id'> { }

interface SliderTranslationsAttributes {
    id: number
    slider_id: number
    locale: string
    title: string
    content: string
    url: string
}

interface TranslateCreationsAttributes extends Optional<SliderTranslationsAttributes, 'id'> { }


class Slider extends Model<SliderAttributes, SliderCreatitionAttributes> implements SliderAttributes {
    public id!: number
    public media!: string
    public media_type!: string

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
    // Define associations here
    public getSliderTranslate!: HasManyGetAssociationsMixin<SliderTranslate>
    public SliderTranslate!: SliderTranslate[]

}

class SliderTranslate extends Model<SliderTranslationsAttributes, TranslateCreationsAttributes> implements SliderTranslationsAttributes {
    public id!: number
    public slider_id!: number
    public locale!: string
    public title!: string
    public content!: string
    public url!: string

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}


Slider.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    media: {
        type: DataTypes.STRING
    },
    media_type: {
        type: DataTypes.STRING
    }
},
    {
        sequelize,
        modelName: 'Slider'
    }

)

SliderTranslate.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    slider_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Slider,
            key: 'id'
        }
    },
    locale: {
        type: DataTypes.STRING
    },
    title: {
        type: DataTypes.STRING
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    url: {
        type: DataTypes.STRING,
        allowNull: true
    }

}, {
    sequelize,
    modelName: 'Slider_translate'
})



export const sliderAssociations = () => {
    SliderTranslate.belongsTo(Slider, { foreignKey: 'slider_id' });
    Slider.hasMany(SliderTranslate, { foreignKey: 'slider_id', onDelete: 'CASCADE' });

}