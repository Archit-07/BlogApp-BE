const Blog = require("../models/blogModel.js");
const asyncHandler = require("express-async-handler");
const Comment = require("../models/commentModel.js");
const User = require("../models/userModel.js");
const { isObjectIdOrHexString } = require("mongoose");

const getBlogs = asyncHandler(async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate({ path: "comments", model: Comment })
      .sort({ updatedAt: -1 });
    if (blogs) {
      // console.log("blogs:",blogs);
      res.json(blogs);
    } else {
      res.json({ message: "there are no blogs" });
    }
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
      const startDateString = req.params.durationFrom; // Date string in '2024-08-17' format
      const endDateString = req.params.durationTo; // Date string in '2024-08-17' format

      if (startDateString > endDateString) {
          throw new Error(`durationTo can't be less than durationFrom`);
      }

      // Convert date strings to UTC format
      const startDate = new Date(startDateString + 'T00:00:00.000Z');
      const endDate = new Date(endDateString + 'T23:59:59.999Z');

      const category = req.params.category; // Replace with the actual category

      let query = { createdAt: { $gte: startDate, $lte: endDate } };

      if (category !== 'all' && category !== ':category') {
        query.category = category;
      }

      const blogs = await Blog.find(query)
          .populate({ path: 'comments', model: Comment })
          .sort({ updatedAt: -1 });

      res.json(blogs);
  } catch (err) {
      res.status(500);
      throw new Error('Something went wrong');
  }
});

const getBlogByCategory = asyncHandler(async (req, res) => {
  try {
    
      if (!req.params.category || req.params.category === ':category') {
          throw new Error(`category can't be empty`);
      }

      const category = req.params.category; // Replace with the actual category

      let query = { category: category };

      const blogs = await Blog.find(query)
          .populate({ path: 'comments', model: Comment })
          .sort({ updatedAt: -1 });

      res.json(blogs);
  } catch (err) {
      res.status(500);
      throw new Error('Something went wrong');
  }
});



const getBlogById = asyncHandler(async (req, res) => {
  try {
    const blog = await Blog.findById({ _id: req.params.id }).populate({
      path: "comments",
      model: Comment,
    });
    console.log(blog);
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
    res.status(201).json(createdBlog);
  } catch (err) {
    console.error('Error saving blog:', err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

const findBlogById = async (id) => {
  return await Blog.findById(id);
};

const findUserByLoginId = async (loginId) => {
  return await User.findOne({ loginId });
};

const deleteBlog = asyncHandler(async (req, res) => {
  try {
    const { id, loginId } = req.params;
    console.log("params:", req.params);

    const blog = await findBlogById(id);
    const user = await findUserByLoginId(loginId);

    if (!blog) {
      res.status(404);
      throw new Error("Blog not found");
    }

    if (blog.user.toString() !== loginId) {
      res.status(401);
      throw new Error("You can't perform this action");
    }

    if (user) {
      const index = user.blogs.indexOf(id);
      if (index > -1) {
        await Comment.deleteMany({ blog: id });
        await blog.deleteOne();
        user.blogs.splice(index, 1);
        await user.save();
        res.json({ status: 200, message: "Blog deleted" });
      } else {
        res.status(404);
        throw new Error("Blog not found in user's blogs");
      }
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500);
    throw new Error("Something went wrong");
  }
});

const updateBlog = asyncHandler(async (req, res) => {
  const { blogName, category, article, authorName } = req.body;
  if (!article && !blogName && !category && !authorName) {
    res.status(400);
    throw new Error(
      "Cannot update an empty article OR blogName OR category OR authorName"
    );
  }
  try {
    const blog = await Blog.findById(req.params.id);

    if (blog.user !== req.user.loginId) {
      res.status(401);
      throw new Error("You can't perform this action");
    }

    if (blog) {
      if (blogName) {
        blog.blogName = blogName;
      }
      if (article) {
        blog.article = article;
      }
      if (category) {
        blog.category = category;
      }
      if (authorName) {
        blog.authorName = authorName;
      }

      const updatedBlog = await blog.save();
      res.json(updatedBlog);
    } else {
      res.status(404);
      throw new Error("Blog not found");
    }
  } catch (err) {
    res.status(500);
    throw new Error("Cannot update blog");
  }
});

const updateLike = asyncHandler(async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (blog) {
      blog.like = blog.like + 1;
      const updatedBlog = await blog.save();
      res.json(updatedBlog);
    } else {
      res.status(404);
      throw new Error("Blog not found");
    }
  } catch (err) {
    res.status(500);
    throw new Error("Cannot update blog");
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
  getBlogByCategory
};
