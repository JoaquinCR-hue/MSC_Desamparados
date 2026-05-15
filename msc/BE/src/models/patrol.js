const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Patrol extends Model {}
  Patrol.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    officerNames: { type: DataTypes.STRING(255) },
    unit: { type: DataTypes.STRING(50) },
    status: { type: DataTypes.STRING(50) },
    zone: { type: DataTypes.STRING(100) },
    unitType: { type: DataTypes.STRING(50) },
    schedule: { type: DataTypes.STRING(100) },
    lat: { type: DataTypes.DECIMAL(10, 8) },
    lng: { type: DataTypes.DECIMAL(11, 8) }
  }, { sequelize, modelName: 'Patrol', tableName: 'Patrols', timestamps: false });
  return Patrol;
};