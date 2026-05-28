const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Location extends Model {
    static associate(models) {
      models.Location.hasMany(models.Report, { foreignKey: 'locationId' });
    }
  }
  Location.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    province: { type: DataTypes.STRING(35) },
    canton: { type: DataTypes.STRING(45) },
    district: { type: DataTypes.STRING(45) },
    neighborhood: { type: DataTypes.STRING(45) },
    street: { type: DataTypes.STRING(100) },
    exactAddress: { type: DataTypes.TEXT },
    lat: { type: DataTypes.DECIMAL(10, 8) },
    lng: { type: DataTypes.DECIMAL(11, 8) }
  }, { sequelize, modelName: 'Location', tableName: 'Locations', timestamps: false });
  return Location;
};