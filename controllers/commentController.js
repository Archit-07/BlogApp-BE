
const asyncHandler = require("express-async-handler");
const Comment = require("../models/commentModel.js");
const Blog = require("../models/blogModel.js");

const addComment = asyncHandler(async (req, res) => {
    const { body} = req.body;
  
    if (!body) {
      res.status(400);
      throw new Error("Cannot create empty Reply");
    } else {
      try{

          const comment = new Comment({ user: req.params.loginId ,blog: req.params.id, body });
          const createdComment = await comment.save();
          let blog = await Blog.findOneAndUpdate({_id:req.params.id},{$push:{comments: createdComment._id}});
          res.status(201).json(createdComment);
      }
      catch(err)
      {
          res.status(500);
          throw new Error(err);
      }
    }
  });

const deleteCommment = asyncHandler(async (req, res) => {
  try{
    // todo
      console.log("delete params:", req.params);
      res.send(200);
    }catch(err){
      console.log(err)
      res.status(500);
      throw new Error("Something went wrong");
    }
  });

  module.exports = {addComment, deleteCommment}