const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      models.User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });
      models.User.hasMany(models.Report, { foreignKey: 'userId' });
    }

    /**
     * Valida si la contraseña proporcionada coincide con la hasheada.
     */
    async validatePassword(password) {
      return await bcrypt.compare(password, this.password);
    }
  }

  User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fullName: { type: DataTypes.STRING(150) },
    email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    password: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(20) },
    nationalId: { type: DataTypes.STRING(25) },
    roleId: { type: DataTypes.INTEGER }
  }, { 
    sequelize, 
    modelName: 'User', 
    tableName: 'Users', 
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  return User;
};