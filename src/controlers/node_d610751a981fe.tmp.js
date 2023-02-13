const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require("crypto")
const mailer = require('../modules/mailer')

const authConfig = require('../config/auth')

const User = require('../models/User')

const router = express.Router()

function generateToken(parmas = {}) {
    return jwt.sign(parmas, authConfig.secret, {
        expiresIn: 86400,
    })
}

router.post('/register', async (req, res,) => {

    const { email } = req.body
    try {

        if (await User.findOne({ email }))
            return res.status(400).send({ error: 'User already exists' })

        const user = await User.create(req.body)

        user.password = undefined

        return res.send({
            user,
            token: generateToken({ id: user.id })
        })

    } catch (err) {
        return res.status(400).send({ error: 'registration failed' })



    }


})
// "validações do login"
router.post('/authenticate', async (req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password')

    if (!user)
        return res.status(400).send({ error: 'User not found' })


    if (!await bcrypt.compare(password, user.password))
        return res.status(400).send({ error: 'Invalid password' })

    user.password = undefined

    const token = jwt.sign({ id: user.id }, authConfig.secret, {
        expiresIn: 86400,
    })

    res.send({
        user,
        token: generateToken({ id: user.id })
    })

})


router.post("/forgot_password", async (req, res) => {
    const { email } = req.body

    try {

        const user = await User.findOne({ email })

        if (!user)
            return res.status(400).send({ error: 'User not found' })

        const token = crypto.randomBytes(20).toString('hex')

        const now = new Date()
        now.getHours(now.getHours() + 1)

        await User.findByIdAndUpdate(user.id, {
            '$set': {
                passwordResetToken: token,
                passwordResetExpires: now,
            }
        })

        mailer.sendMail({
            to: email,
            from: "gabrielvaillant2@mail.com",
            template: "../resources/mail/auth/forgot_password.html",
            contex: { token },
        }, (err) => {
            if (err)
            console.log(err)
                return res.status(400).send({ error: "Cannot send forgot password email" })

            return res.send()
        })



    } catch (err) {
        console.log(err)
        res.status(400).send({ error: "Erro on forgot password, try again" })

    }

})


module.exports = app => app.use('/auth', router)

