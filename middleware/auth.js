// authentication middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const randomToken = require('rand-token');
const RefreshToken = require('../models/RefreshToken');
const Role = require("../models/Role");

require('dotenv').config()

const checkPermissions = (permissions, allowed) =>{
    return (permissions.some(p => allowed.includes(p)))
}

const setTokenCookie = (res, token) => {
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + (1 * 24 * 60 * 60 * 1000))
    };
    res.cookie('refreshToken', token, cookieOptions);
};

// Create a new object from the monogoose model
const generateRefreshToken = (userId, ipAddress) => {
    return new RefreshToken({
        user: userId,
        token: randomToken.uid(256),
        expiresAt: new Date(Date.now() + (1 * 24 * 60 * 60 * 1000)),
        createdByIP: ipAddress
    });
};

// Generate a new JWT access token
const generateAccessToken = (user) => {
    return jwt.sign({ sub: user.email, role: user.role }, process.env.ACCESS_SECRET, { expiresIn: process.env.REFRESH_TIME })
};

// Validate a refresh token
const getRefreshToken = async (token) => {
    const refreshToken = await RefreshToken.findOne({ token: token });

    if (!refreshToken || !refreshToken.isActive) throw new Error('Refresh token is not valid');
    return refreshToken;
};

const getRefreshTokens = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const refreshTokens = await RefreshToken.find({ user: userId });
    return refreshTokens;
};

const refreshToken = async (token, ipAddress) => {
    const refreshToken = await getRefreshToken(token);

    if (!refreshToken) throw new Error('Refresh token is not valid');


    var user = await User.findById(refreshToken.user).lean();
    const rolePermissions = await Role.findOne({ role: user.role});
    // Replace the old refresh token with a new one.
    const newRefreshToken = generateRefreshToken(refreshToken.user, ipAddress);
    refreshToken.revokedAt = Date.now();
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await newRefreshToken.save();

    const accessToken = generateAccessToken(user);

    return {
        accessToken: accessToken,
        refreshToken: newRefreshToken.token,
        ref: user,
        permissions: rolePermissions.permissions
    };
};

const revokeToken = async (token, ipAddress) => {
    const refreshToken = await getRefreshToken(token);

    // Revoke the refresh token.
    refreshToken.revokedAt = Date.now();
    refreshToken.revokedByIP = ipAddress;
    await refreshToken.save();
};



const authenticateToken = async(req, res , next) =>{
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    const email = req.headers.email;

    try{
        decodeRes= jwt.verify(token,process.env.ACCESS_SECRET );

        const user = await User.findOne({email: decodeRes.sub});
        if(!user || user.email !== email || JSON.stringify(user.role) !== JSON.stringify(decodeRes.role)){
            return  res.status(401).json({message: "Unauthorized access"})
        }

        const role = await Role.findOne({role: user.role});

        req.email = decodeRes.sub
        req.role = decodeRes.role
        req._id = user._id
        req.permissions = role.permissions
        const refreshTokens = await RefreshToken.find({ user: user._id});
        
        req.ownsToken = token => !!refreshTokens.find(x => x.token === token);
        
        next();
    }catch(error){
        // console.log(error)
        res.status(401).json({success: false, message: error.message})
    }
}

module.exports = {generateRefreshToken,
    generateAccessToken,
    getRefreshToken,
    getRefreshTokens,
    refreshToken,
    revokeToken,
    setTokenCookie,
    authenticateToken,
    checkPermissions
};