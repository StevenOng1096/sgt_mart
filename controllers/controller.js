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
}

module.exports = Controller