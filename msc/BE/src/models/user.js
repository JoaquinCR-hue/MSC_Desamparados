const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      models.User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });
      models.User.hasMany(models.Report, { foreignKey: 'userId' });
    }
  }
  User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fullName: { type: DataTypes.STRING(150) },
    email: { type: DataTypes.STRING(100) },
    password: { type: DataTypes.STRING(255) },
    phone: { type: DataTypes.STRING(20) },
    nationalId: { type: DataTypes.STRING(25) },
    roleId: { type: DataTypes.INTEGER }
  }, { sequelize, modelName: 'User', tableName: 'Users', timestamps: false });
  return User;
};