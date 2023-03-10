const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.json')


const { schema } = require("../models/User")

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader)
        return res.status(401).send({ error: 'No token provided' })


    const parts = authHeader.split(' ')

    if (!parts.length === 2)
        return res.status(401).send({ error: 'Token error' })

    const [scheme, token] = parts

    //if (!/^Bearer$/i.test(schema))
     //   return res.status(401).send({ error: 'Token malformated' })

    //!!!!!! 
    
    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err) return res.status(401).send({ error: ' Token invalid' })

        req.userId = decoded.id
        return next()

    })


}