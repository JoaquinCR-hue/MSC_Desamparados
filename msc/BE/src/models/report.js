const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Report extends Model {
    static associate(models) {
      models.Report.belongsTo(models.User, { foreignKey: 'userId', as: 'creator' });
      models.Report.belongsTo(models.IncidentType, { foreignKey: 'incidentTypeId', as: 'incidentType' });
      models.Report.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });
    }
  }
  Report.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    description: { type: DataTypes.TEXT },
    date: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING(25) },
    userId: { type: DataTypes.INTEGER },
    incidentTypeId: { type: DataTypes.INTEGER },
    locationId: { type: DataTypes.INTEGER }
  }, { sequelize, modelName: 'Report', tableName: 'Reports', timestamps: false });
  return Report;
};