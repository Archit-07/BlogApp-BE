 const{ addComment, deleteCommment} = require("../controllers/commentController");
  const{ protect} = require("../middleware/authMiddleware.js");
  const express = require('express');
  const router = express.Router();
  
  router.route("/:loginId/reply/:id").post(protect, addComment);
  router.route("/:loginId/delete/:id/:cid").delete(protect, deleteCommment);
  
  module.exports= router;