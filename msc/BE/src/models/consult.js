const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Consult extends Model {}
  Consult.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nationalId: { type: DataTypes.STRING(25) },
    fullName: { type: DataTypes.STRING(150) },
    email: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(20) },
    consultType: { type: DataTypes.STRING(50) },
    description: { type: DataTypes.TEXT },
    date: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING(25), defaultValue: 'Pendiente' },
    response: { type: DataTypes.TEXT },
    responseDate: { type: DataTypes.DATE }
  }, { sequelize, modelName: 'Consult', tableName: 'Consults', timestamps: false });
  return Consult;
};