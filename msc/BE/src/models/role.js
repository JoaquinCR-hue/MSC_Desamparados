const { Model, DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  class Role extends Model {
    static associate(models) {
      models.Role.hasMany(models.User, { foreignKey: 'roleId' });
    }
  }
  Role.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(45) },
    description: { type: DataTypes.STRING(150) }
  }, { sequelize, modelName: 'Role', tableName: 'Roles', timestamps: false });
  return Role;
};