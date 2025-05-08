'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      // define association here
      Order.belongsToMany(models.Product, {
        through: models.OrderProduct,
        foreignKey: 'OrderId',
      })
    }

    static async findOrCreateCart(userId) {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const [cart] = await this.findOrCreate({
        where: {
          UserId: userId,
          orderStatus: 'cart'
        },
        defaults: {
          UserId: userId,
          orderDate: new Date(),
          orderStatus: 'cart',
          orderTotal: 0
        }
      });
      
      return cart;
    }
    
    static async getCartWithProducts(cartId, models) {
      const { Product, OrderProduct } = models;
      
      const cartWithProducts = await this.findByPk(cartId, {
        include: [{
          model: Product,
          through: {
            model: OrderProduct,
            as: 'OrderProduct',
            attributes: ['quantity', 'price']
          }
        }]
      });
      
      return cartWithProducts;
    }

    static calculateCartTotals(cart) {
      let totalItems = 0;
      let totalAmount = 0;
      
      if (cart.Products && cart.Products.length > 0) {
        // Count total items
        totalItems = cart.Products.reduce((sum, product) => {
          return sum + product.OrderProduct.quantity;
        }, 0);
        
        // Calculate total amount
        totalAmount = cart.Products.reduce((sum, product) => {
          return sum + (product.OrderProduct.price * product.OrderProduct.quantity);
        }, 0);
      }
      
      return { totalItems, totalAmount };
    }

    static async updateCartTotal(cart, calculatedTotal) {
      if (cart.orderTotal !== calculatedTotal) {
        await cart.update({ orderTotal: calculatedTotal });
        cart.orderTotal = calculatedTotal;
      }
      
      return cart;
    }
  }
  Order.init({
    UserId: DataTypes.INTEGER,
    orderDate: DataTypes.DATE,
    orderStatus: DataTypes.STRING,
    orderTotal: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};