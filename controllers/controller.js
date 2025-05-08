const { Op, where } = require('sequelize');
const {User, Product, Category, Profile, Order, OrderProduct} = require('../models')
const formatDate = require('../helpers/formatDate')

class Controller {

    static async home (req, res) {
        try {
            res.render('home', { user: req.session.user || null });
        } catch (error) {
            res.send(error)
        }
    }

    static async dashboard (req, res) {
        try {
            if (!req.session.user) {
                return res.redirect('/login');
            }

            let options = {
                include: Category,
                order: [
                    ['id', 'ASC']
                ], 
                where: {}
            }
            let {search} = req.query;

            if (search) {
                options.where.name = {
                    [Op.iLike] : `%${search}%`
                }
            }


            let products = await Product.findAll(options)

            res.render('dashboard', { user: req.session.user, products });
        } catch (error) {
            console.log(error)
            res.send(error)
        }
    }

    static async profile (req, res) {
        try {
            if (!req.session.user) {
                return res.redirect('/login');
              }

            let profile = await Profile.findAll({
                where: {
                    UserId: req.session.user.id
                }
            })


            res.render('profile', {profile, formatDate})
            
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    }

    static async getAddProfile (req, res) {
        try {
            if (!req.session.user) {
                return res.redirect('/login');
              }

              let {errors} = req.query
            
            res.render('addProfile', {errors})
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    }

    static async postAddProfile (req, res) {
        try {
            let {name, address, dateOfBirth, badge} = req.body
            let UserId = req.session.user.id

            console.log(req.body)

            await Profile.create({
                name,
                address,
                dateOfBirth,
                badge,
                UserId
            })

            res.redirect('/profile')
        } catch (error) {
            if (error.name === 'SequelizeValidationError') {
                let errors = error.errors.map(err => err.message)

                res.redirect(`/profile/add?errors=${errors}`)
            } else {
                console.log(error);
                res.send(error)
            }
        }
    }

    static async getEditProfile (req, res) {
        try {
            if (!req.session.user) {
                return res.redirect('/login');
            }

            let {errors} = req.query

            let profile = await Profile.findAll({
                where: {
                    UserId: req.session.user.id
                }
            })

            res.render('editProfile', {profile, formatDate, errors})
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    }
    
    static async postEditProfile (req, res) {
        try {
            let {name, address, dateOfBirth, badge} = req.body
            let UserId = req.session.user.id

            await Profile.update({
                name,
                address,
                dateOfBirth,
                badge,
                UserId
            }, {
                where: {
                    UserId
                }
            })

            res.redirect('/profile')
        } catch (error) {
            if (error.name === 'SequelizeValidationError') {
                let errors = error.errors.map(err => err.message)

                res.redirect(`/profile/edit?errors=${errors}`)
            } else {
                console.log(error);
                res.send(error)
            }
        }
    }

    static async deleteProfile (req, res) {
        try {
            if (!req.session.user) {
                return res.redirect('/login');
              }
            
            let UserId = req.session.user.id

            await Profile.destroy({
                where: {
                    UserId
                }
            })

            res.redirect('/profile')
        } catch (error) {
            console.log(error);
            res.send(error)
        }
    }

    static async getCart (req, res) {
        try {
            const userId = req.session.user.id;

            const cart = await Order.findOrCreateCart(userId);
            const cartWithProducts = await Order.getCartWithProducts(cart.id, { Product, OrderProduct });
            
            // Calculate totals
            const { totalItems, totalAmount } = Order.calculateCartTotals(cartWithProducts);
            
            // Update cart total if needed
            await Order.updateCartTotal(cart, totalAmount);
            
            // Render cart template with data
            res.render('cart', {
                cart: cartWithProducts,
                totalItems,
                totalAmount,
                user: req.session.user
            });
        } catch (error) {
            console.log(error)
            res.send(error)
        }
    }

    static async addToCart (req, res) {
        try {
            const userId = req.session.user.id;
            const productId = req.params.id;
            
            // Find the product
            const product = await Product.findByPk(productId);
            if (!product) {
                req.flash('error', 'Product not found');
                return res.redirect('/dashboard');
            }
            
            // Find or create user's cart
            const [cart] = await Order.findOrCreate({
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
            
            // Check if product already in cart
            const existingItem = await OrderProduct.findOne({
                where: {
                OrderId: cart.id,
                ProductId: productId
                }
            });
            
            if (existingItem) {
                // Update quantity if product already in cart
                await existingItem.update({
                quantity: existingItem.quantity + 1
                });
            } else {
                // Add new product to cart
                await OrderProduct.create({
                OrderId: cart.id,
                ProductId: productId,
                quantity: 1,
                price: product.price // Store current price
                });
            }
            
            // Update cart total
            const cartItems = await OrderProduct.findAll({
                where: { OrderId: cart.id }
            });
            
            const newTotal = cartItems.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
            
            await cart.update({ orderTotal: newTotal });
            
            res.redirect('/dashboard');
        } catch (error) {
            console.log(error)
            res.send(error)
        }
    }

    static async removeCartItem (req, res) {
        try {
            const userId = req.session.user.id;
            const productId = req.params.id;
            
            // Find user's cart
            const cart = await Order.findOne({
                where: {
                UserId: userId,
                orderStatus: 'cart'
                }
            });
            
            if (!cart) {
                req.flash('error', 'Cart not found');
                return res.redirect('/cart');
            }
            
            // Delete the cart item
            const result = await OrderProduct.destroy({
                where: {
                OrderId: cart.id,
                ProductId: productId
                }
            });
            
            if (result === 0) {
                req.flash('error', 'Product not found in cart');
                return res.redirect('/cart');
            }
            
            // Recalculate cart total
            const cartItems = await OrderProduct.findAll({
                where: { OrderId: cart.id }
            });
            
            const newTotal = cartItems.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
            
            await cart.update({ orderTotal: newTotal });
            
            res.redirect('/cart');
        } catch (error) {
            console.log(error)
            res.send(error)
        }
    }


    // CHECKOUT - EASY INVOICE PACKAGE-----------------------------------------
    static async checkout(req, res) {
        try {
          const userId = req.session.user.id;
          
          // Get user's cart
          const cart = await Order.findOrCreateCart(userId);
          
          // Check if cart has products
          const cartWithProducts = await Order.getCartWithProducts(cart.id, { Product, OrderProduct });
          
          if (!cartWithProducts.Products || cartWithProducts.Products.length === 0) {
            req.flash('error', 'Your cart is empty');
            return res.redirect('/cart');
          }
          
          // Process checkout
          const order = await Order.checkout(cart.id);
          
          // Generate invoice (using the new static method)
          const invoicePdf = await Order.generateInvoice(order.id, { Product, OrderProduct, User });
          
          // Create invoices directory if it doesn't exist
          const invoicesDir = path.join(__dirname, '../public/invoices');
          try {
            await fs.mkdir(invoicesDir, { recursive: true });
          } catch (err) {
            // Directory already exists or cannot be created
            console.error('Error creating invoices directory:', err);
          }
          
          // Save the invoice to a file
          const invoicePath = path.join(invoicesDir, `invoice-${order.id}.pdf`);
          await fs.writeFile(invoicePath, invoicePdf);
          
          // Save the invoice path to the order if you have an invoicePath field
          // await order.update({ invoicePath: `/invoices/invoice-${order.id}.pdf` });
          
          // Set session data for confirmation page
          req.session.lastOrder = {
            id: order.id,
            total: order.orderTotal,
            invoicePath: `/invoices/invoice-${order.id}.pdf`
          };
          
          req.flash('success', 'Your order has been placed successfully!');
          res.redirect('/checkout/confirmation');
        } catch (error) {
          console.log(error);
        //   req.flash('error', 'An error occurred during checkout');
          res.redirect('/cart');
        }
      }
      
      static async checkoutConfirmation(req, res) {
        try {
          // Check if we have order data in session
          if (!req.session.lastOrder) {
            return res.redirect('/cart');
          }
          
          const { id, total, invoicePath } = req.session.lastOrder;
          
          res.render('checkout-confirmation', {
            orderId: id,
            total,
            invoicePath,
            user: req.session.user
          });
          
          // Clear the lastOrder data from session after showing confirmation
          delete req.session.lastOrder;
        } catch (error) {
          console.log(error);
          res.redirect('/cart');
        }
      }
      
      static async downloadInvoice(req, res) {
        try {
          const orderId = req.params.id;
          
          // Check if user owns this order
          const order = await Order.findOne({
            where: {
              id: orderId,
              UserId: req.session.user.id
            }
          });
          
          if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/orders');
          }
          
          // Generate invoice
          const invoicePdf = await Order.generateInvoice(orderId, { Product, OrderProduct, User });
          
          // Set response headers for PDF download
          res.set('Content-Type', 'application/pdf');
          res.set('Content-Disposition', `attachment; filename="invoice-${orderId}.pdf"`);
          
          // Send the PDF as response
          res.send(invoicePdf);
        } catch (error) {
          console.log(error);
          req.flash('error', 'Failed to download invoice');
          res.redirect('/orders');
        }
      }
}

module.exports = Controller