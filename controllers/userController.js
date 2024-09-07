const asyncHandler = require("express-async-handler");
const User = require("../models/userModel.js");
const generateToken = require("../utils/generateToken.js");
const mongoose = require("mongoose");
const path = require("path");
const Blog = require("../models/blogModel.js");


const authUser = asyncHandler(async (req, res) => {
  const { loginId, password } = req.body;

  const user = await User.findOne({ loginId });
  if (!user) {
    res.status(401);
    throw new Error("User not found");
  } else if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      fistName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      loginId: user.loginId,
      pic: user.pic,
      contact: user.contact,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, loginId, password, contact } = req.body;

  const ID = await User.findOne({ loginId });
  if (ID) {
    res.status(404);
    throw new Error("Username is not available");
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(404);
    throw new Error("User already exists");
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    loginId,
    password,
    contact,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      loginId: user.loginId,
      pic: user.pic,
      contact: user.contact,
      token: generateToken(user._id),
    });
  } else {
    res.status(404).json({message:"user Not Found"});
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      if (req.body.password) {
        user.password = req.body.password;
      }
      user.loginId = req.body.loginId || user.loginId;
      user.email = req.body.email || user.email;
      user.contact = req.body.contact || user.contact;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        password: updatedUser.password,
        loginId: updatedUser.loginId,
        email: updatedUser.email,
        contact: updatedUser.contact,
        pic: updatedUser.pic,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({message:"user Not Found"});
    }
  }
  catch (err) {
    res.status(500).json({message:"something went wrong"});
  }
});

const forgotPass = asyncHandler(async (req, res) => {
  try {
    const { loginId, email, password } = req.body;
    const user = await User.findOne({ loginId });

    if (user && user.email === email) {
      user.password = password;
      const updatedUser = await user.save();
      console.log(updatedUser);
      res.status(200).json({ message: "Password updated successfully!" });
    } else {
      console.log("invalid email");
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ message: "Something went wrong" });
  }
});


const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate({path: 'blogs', model: Blog});

  if (users) res.json(users);
  else {
    res.status(404).json({message:"Not Found"});
  }
});

const searchUser = asyncHandler(async (req, res) => {
  const users = (await User.find()).filter(user => user.loginId.includes(req.params.loginId));
    
  if (users) res.status(200).json(users);
  else {
    res.status(404).json({message:"Not Found"});
  }
});

const getUser = asyncHandler(async (req, res) => {
  const users = await User.find({loginId:req.params.loginId}).populate({path: 'blogs', model: Blog})
    
  if (users) res.status(200).json(users);
  else {
    res.status(404).json({message:"Not Found"});
  }
});

module.exports = {
  authUser,
  updateUserProfile,
  registerUser,
  searchUser,
  forgotPass,
  getUsers,
  getUser
};
