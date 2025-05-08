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

      Order.belongsTo(models.User, {
        foreignKey: 'UserId'
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

    static async checkout(cartId) {
      const cart = await this.findByPk(cartId);
      
      if (!cart) {
        throw new Error('Cart not found');
      }
      
      // Update cart to pending order
      await cart.update({
        orderStatus: 'pending',
        orderDate: new Date()
      });
      
      return cart;
    }

    // static async generateInvoice(orderId, models) {
    //   try {
    //     const { Product, OrderProduct, User } = models;
        
    //     // Get order with products
    //     const order = await this.findByPk(orderId, {
    //       include: [
    //         {
    //           model: Product,
    //           through: {
    //             model: OrderProduct,
    //             as: 'OrderProduct',
    //             attributes: ['quantity', 'price']
    //           }
    //         },
    //         {
    //           model: User,
    //           attributes: ['name', 'email', 'address']
    //         }
    //       ]
    //     });
        
    //     if (!order) {
    //       throw new Error('Order not found');
    //     }
        
    //     // Format products for invoice
    //     const products = order.Products.map(product => {
    //       return {
    //         quantity: product.OrderProduct.quantity,
    //         description: product.name,
    //         "tax-rate": 10, // Assuming 10% tax rate
    //         price: product.OrderProduct.price
    //       };
    //     });
        
    //     // Create invoice data
    //     const data = {
    //       // Customize with your business information
    //       "images": {
    //         // If you have a logo, use base64 string
    //         "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png"
    //       },
    //       "sender": {
    //         "company": "SGT Mart",
    //         "address": "Jakarta Barat",
    //         "zip": "11830",
    //         "city": "Jakarta",
    //         "country": "Indonesia"
    //       },
    //       "client": {
    //         "company": order.User?.name || "Valued Customer",
    //         "address": order.User?.address || "",
    //         "zip": "",
    //         "city": "",
    //         "country": "Indonesia"
    //       },
    //       "information": {
    //         "number": `INV-${order.id}`,
    //         "date": new Date(order.orderDate).toLocaleDateString(),
    //         "due-date": new Date(order.orderDate).toLocaleDateString()
    //       },
    //       "products": products,
    //       "bottom-notice": "Thank you for your business!",
    //       "settings": {
    //         "currency": "IDR"
    //       }
    //     };
        
    //     // Generate PDF invoice
    //     const easyinvoice = require('easyinvoice');
    //     const result = await easyinvoice.createInvoice(data);
        
    //     // Return PDF as buffer
    //     return Buffer.from(result.pdf, 'base64');
    //   } catch (error) {
    //     console.error('Error generating invoice:', error);
    //     throw error;
    //   }
    // }

    static async generateInvoice(orderId, models) {
      try {
        const { Product, OrderProduct } = models;
        
        // Get order with products using correct associations
        const order = await this.findByPk(orderId, {
          include: [{
            model: Product,
            // Ensure the association alias matches what's defined in your model
            through: {
              model: OrderProduct,
              // Be careful with the 'as' - it should match your association setup
              // If you don't have an 'as' in your association, don't use one here either
              attributes: ['quantity', 'price']
            }
          }]
        });
        
        if (!order) {
          throw new Error('Order not found');
        }
        
        // Debug to see what's coming back
        console.log("Order found:", order.id);
        console.log("Product count:", order.Products ? order.Products.length : 0);
        
        if (order.Products && order.Products.length > 0) {
          // Log the first product to see its structure
          console.log("First product:", JSON.stringify(order.Products[0].toJSON(), null, 2));
        }
        
        // Make sure we have products
        if (!order.Products || order.Products.length === 0) {
          throw new Error('No products found in order');
        }
        
        // Carefully format products for invoice
        const products = order.Products.map(product => {
          // Debug to see junction table data
          console.log(`Product ${product.id} junction data:`, 
                      product.OrderProduct ? 
                      JSON.stringify(product.OrderProduct.toJSON(), null, 2) : 
                      "OrderProduct not found!");
          
          // Check what properties are available and use appropriate ones
          const quantity = product.OrderProduct ? product.OrderProduct.quantity : 1;
          // Make sure price is a number
          const price = product.OrderProduct ? 
                        parseFloat(product.OrderProduct.price) : 
                        parseFloat(product.price);
          
          return {
            quantity: quantity,
            description: product.name || "Product",
            "tax-rate": 10,
            price: price
          };
        });
        
        console.log("Formatted products for invoice:", JSON.stringify(products, null, 2));
        
        // Create invoice data
        const data = {
          "images": {
            "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png"
          },
          "sender": {
            "company": "SGT Mart",
            "address": "Jalan Raya Bandung",
            "zip": "40123",
            "city": "Bandung",
            "country": "Indonesia"
          },
          "client": {
            "company": "Valued Customer",
            "address": "",
            "zip": "",
            "city": "",
            "country": "Indonesia"
          },
          "information": {
            "number": `INV-${order.id}`,
            "date": new Date(order.orderDate).toLocaleDateString(),
            "due-date": new Date(order.orderDate).toLocaleDateString()
          },
          "products": products,
          "bottom-notice": "Thank you for your business!",
          "settings": {
            "currency": "IDR"
          }
        };
        
        console.log("Invoice data prepared, generating PDF...");
        
        // Generate PDF invoice
        const easyinvoice = require('easyinvoice');
        const result = await easyinvoice.createInvoice(data);
        
        console.log("Invoice generated successfully");
        
        // Return PDF as buffer
        return Buffer.from(result.pdf, 'base64');
      } catch (error) {
        console.error('Error generating invoice:', error);
        throw error;
      }
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