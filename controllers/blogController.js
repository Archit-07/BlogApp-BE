const Blog = require("../models/blogModel.js");
const asyncHandler = require("express-async-handler");
const Comment = require("../models/commentModel.js");
const User = require("../models/userModel.js");
const { isObjectIdOrHexString } = require("mongoose");
const { sendMessage, runProducer } = require('../kafka');

runProducer().catch(console.error);

const getBlogs = asyncHandler(async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate({ path: "comments", model: Comment })
      .sort({ updatedAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500);
    throw new Error("Something went wrong");
  }
});

const getUserBlogs = asyncHandler(async (req, res) => {
  try {
    const blogs = await Blog.find({ user: req.params.loginId })
      .populate({ path: "comments", model: Comment })
      .sort({ updatedAt: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500);
    throw new Error("Something went wrong");
  }
});

const getBlogByCategoryAndDuration = asyncHandler(async (req, res) => {
  try {
    const { durationFrom, durationTo, category } = req.params;

    if (durationFrom > durationTo) {
      throw new Error(`durationTo can't be less than durationFrom`);
    }

    const startDate = new Date(durationFrom + "T00:00:00.000Z");
    const endDate = new Date(durationTo + "T23:59:59.999Z");

    let query = { createdAt: { $gte: startDate, $lte: endDate } };
    if (category !== "all" && category !== ":category") {
      query.category = category;
    }

    const blogs = await Blog.find(query)
      .populate({ path: "comments", model: Comment })
      .sort({ updatedAt: -1 });

    res.json(blogs);
  } catch (err) {
    res.status(500);
    throw new Error("Something went wrong");
  }
});

const getBlogByCategory = asyncHandler(async (req, res) => {
  try {
    const { category } = req.params;

    if (!category || category === ":category") {
      throw new Error(`category can't be empty`);
    }

    const blogs = await Blog.find({ category })
      .populate({ path: "comments", model: Comment })
      .sort({ updatedAt: -1 });

    res.json(blogs);
  } catch (err) {
    res.status(500);
    throw new Error("Something went wrong");
  }
});

const getBlogById = asyncHandler(async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate({
      path: "comments",
      model: Comment,
    });
    if (blog) {
      res.status(200).json({ blog });
    } else {
      res.status(404).json({ message: "Blog not found" });
    }
  } catch (err) {
    res.status(500);
    throw new Error("Something went wrong");
  }
});

const addBlog = asyncHandler(async (req, res) => {
  const { blogName, category, article, authorName } = req.body;

  if (!article || !blogName || !category || !authorName) {
    return res.status(400).json({ message: "Cannot create empty article OR blogName OR category OR authorName" });
  }

  try {
    const blog = new Blog({
      user: req.params.loginId,
      blogName,
      category,
      article,
      authorName,
    });
    const createdBlog = await blog.save();

    await User.findOneAndUpdate(
      { loginId: req.params.loginId },
      { $push: { blogs: createdBlog._id } }
    );

    // Send Kafka message after blog creation
    await sendMessage('blog-events', JSON.stringify({ type: 'BLOG_CREATED', blog: createdBlog }));

    res.status(201).json(createdBlog);
  } catch (err) {
    console.error('Error saving blog:', err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

const deleteBlog = asyncHandler(async (req, res) => {
  try {
    const { id, loginId } = req.params;
    const blog = await Blog.findById(id);
    const user = await User.findOne({ loginId });

    if (!blog || blog.user.toString() !== loginId) {
      res.status(404).json({ message: "Blog not found or unauthorized action" });
      return;
    }

    await Comment.deleteMany({ blog: id });
    await blog.deleteOne();
    user.blogs.pull(id);
    await user.save();

    // Send Kafka message after blog deletion
    await sendMessage('blog-events', JSON.stringify({ type: 'BLOG_DELETED', blogId: id }));

    res.json({ status: 200, message: "Blog deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

const updateBlog = asyncHandler(async (req, res) => {
  const { blogName, category, article, authorName } = req.body;
  
  if (!article && !blogName && !category && !authorName) {
    res.status(400).json({ message: "Cannot update with empty fields" });
    return;
  }

  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog || blog.user.toString() !== req.params.loginId) {
      res.status(401).json({ message: "Unauthorized action or blog not found" });
      return;
    }

    if (blogName) blog.blogName = blogName;
    if (article) blog.article = article;
    if (category) blog.category = category;
    if (authorName) blog.authorName = authorName;

    const updatedBlog = await blog.save();

    // Send Kafka message after blog update
    await sendMessage('blog-events', JSON.stringify({ type: 'BLOG_UPDATED', blog: updatedBlog }));

    res.json(updatedBlog);
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

const updateLike = asyncHandler(async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      res.status(404).json({ message: "Blog not found" });
      return;
    }

    blog.like += 1;
    const updatedBlog = await blog.save();

    // Send Kafka message after blog like update
    await sendMessage('blog-events', JSON.stringify({ type: 'BLOG_LIKED', blog: updatedBlog }));

    res.json(updatedBlog);
  } catch (err) {
    res.status(500).json({ message: "Cannot update blog like" });
  }
});

module.exports = {
  getBlogById,
  getBlogs,
  addBlog,
  deleteBlog,
  updateBlog,
  updateLike,
  getUserBlogs,
  getBlogByCategoryAndDuration,
  getBlogByCategory,
};
