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

    static async login (req, res) {
        try {
            res.render('login')
        } catch (error) {
            res.send(error)
        }
    }

    static async register (req, res) {
        try {
            res.render('register')
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

    



}

module.exports = Controller