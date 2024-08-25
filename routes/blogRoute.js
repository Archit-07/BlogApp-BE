const {
    getBlogById,
    getBlogs,
    addBlog,
    deleteBlog,
    updateBlog,
    updateLike,
    getUserBlogs,
    getBlogByCategoryAndDuration,
    getBlogByCategory
  } = require('../controllers/blogController')
    const{ protect} = require("../middleware/authMiddleware.js");
    const express = require('express');
    const router = express.Router();
    
    router.route("/:loginId/add").post(protect, addBlog);
    router.route("/:loginId/update/:id").put(protect, updateBlog);
    router.route("/:loginId/like/:id").put(protect, updateLike);
    router.route('/:loginId/delete/:id').delete(protect,deleteBlog);
    router.route('/blogs/getall').get(getBlogs ) ;
    router.route('/user/all/:loginId').get(protect, getUserBlogs) ;
    router.route('/blog/:id').get(getBlogById);
    router.route('/blogs/get/:category/:durationFrom/:durationTo').get(getBlogByCategoryAndDuration);
    router.route('/blogs/info/:category').get(getBlogByCategory);
  
    module.exports= router;