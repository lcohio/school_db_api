'use strict';

const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Sequelize.Model {}
  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "First name cannot be null!"
        },
        notEmpty: {
          msg: "First name is required!"
        }
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Last name cannot be null!"
        },
        notEmpty: {
          msg: "Last name is required!"
        }
      }
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Email cannot be null"
        },
        isEmail: {
          msg: "Valid email is required!"
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Password cannot be null!"
        },
        notEmpty: {
          msg: "Password is required!"
        }
      }
    }
  }, { sequelize });

  User.associate = (models) => {
    User.hasMany(models.Course, {
      foreignKey: 'userId',
      allowNull: false
    });
  }
  return User;
}