'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // define association here
      Product.belongsTo(models.Category, {
        foreignKey: 'CategoryId',
      });

      Product.belongsToMany(models.Order, {
        through: models.OrderProduct,
        foreignKey: 'ProductId',
      });
    }

    get formatRupiah() {
      return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(this.price)
    }
  }
  
  Product.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    price: DataTypes.INTEGER,
    CategoryId: DataTypes.INTEGER,
    imageUrl: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Product',
  });
  return Product;
};