const mongoose = require("mongoose");

const BlogSchema = mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
      immutable: true,
    },
    blogName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    article: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    like: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Blog = mongoose.model("Blogs", BlogSchema);

module.exports = Blog;
