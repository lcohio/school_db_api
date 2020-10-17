'use strict';

const express = require('express');
const router = express.Router();
const auth = require('basic-auth');
const { User, Course } = require('../models');
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

// Return a list of courses
router.get('/courses', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    attributes: {
      exclude: ["createdAt", "updatedAt"]
    }
  });
  res.status(200).json(courses);
}));

// Return matching course by Id
router.get('/courses/:id', asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    where: {
      id: req.params.id
    },
    attributes: {
      exclude: ["createdAt", "updatedAt"]
    }
  });
  res.status(200).json(course);
}));

// Create a new course, add course to db
router.post('/courses', authenticateUser, asyncHandler(async (req, res, next) => {
  try {
    await Course.create(req.body);
    const course = await Course.findOne({
      where: {
        title: req.body.title
      }
    });
    const id = course.id;
    res.status(201).set({
      Location: `http://localhost:${process.env.PORT || 5000}/api/courses/${id}`
    }).end();
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      throw error;
    }
  }
}));

// Update a course
router.put('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const courseData = req.body;
    const course = await Course.findByPk(req.params.id);
    if (course.userId === req.user.id) {
      await course.update({
        title: courseData.title,
        description: courseData.description,
        estimatedTime: courseData.estimatedTime,
        materialsNeeded: courseData.materialsNeeded
      });
      res.status(204).end();
    } else {
      res.status(403).json({
        error: "You can't change someone else's course."
      });
    }
  } catch(error) {
    if(error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message);
      res.status(400).json({ errors });
    } else {
      throw error;
    }
  }
}));

// Delete a course
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (course.userId === req.user.id) {
      await course.destroy();
      res.status(200).end();
    } else {
      res.status(403).json({
        error: "You can't delete someone else's course."
      });
    }
  } catch (error){
    next(error);
  }
}));

module.exports = router;