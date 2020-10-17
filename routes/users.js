'use strict';

const express = require('express');
const router = express.Router();
const auth = require('basic-auth');
const { User } = require('../models');
const bcryptjs = require('bcryptjs');

// Authenticator middleware
const authenticateUser = async (req, res, next) => {
  try {
    const credentials = auth(req);
    const username = credentials.name;
    const pass = credentials.pass;

    // check IF all credential values exist and retrieve matching user
    if(username && pass) {
      const user = await User.findOne({
        where: {
          emailAddress: username
        }
      })
      if(user) {
        const userPass = user.password;
        const passSync = bcryptjs.compareSync(
          pass,
          userPass
        );
        if(passSync) {
          req.user = user;
          next();
        } else {
          res.status(401).json({
            error: "Wrong password"
          });
        }
      }
    }
  } catch(error) {
    res.status(401).json(error);
  }
}

// Handler function to wrap each route
function asyncHandler(cb) {
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(err) {
      res.status(500).send(err);
    }
  }
}

// Route returns the currently authenticated user
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: {
      id: req.user.id
    },
    attributes: {
      exclude: ["password", "createdAt", "updatedAt"]
    }
  })
  res.status(200).json(user);
}));

// Route creates a new user
router.post('/users', asyncHandler(async (req, res, next) => {
  try {
    const user = req.body;
    user.password = bcryptjs.hashSync(req.body.password);
    const emailExists = await User.findOne({
      where: {
        emailAddress: user.emailAddress
      }
    });
    if(emailExists) {
      res.status(400).json({
        error: "Email address is taken"
      });
    } else {
      await User.create(user);
      res.status(201).set({
        Location: `http://localhost:${process.env.PORT || 5000}/`
      }).end();
    }
  } catch(error) {
    if(error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      next(error);
    }
  }
}));

module.exports = router;