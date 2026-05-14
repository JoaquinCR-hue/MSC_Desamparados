const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class IncidentType extends Model {
    static associate(models) {
      models.IncidentType.hasMany(models.Report, { foreignKey: 'incidentTypeId' });
    }
  }
  IncidentType.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(60) },
    description: { type: DataTypes.STRING(150) },
    severity: { type: DataTypes.STRING(20) }
  }, { sequelize, modelName: 'IncidentType', tableName: 'IncidentTypes', timestamps: false });
  return IncidentType;
};