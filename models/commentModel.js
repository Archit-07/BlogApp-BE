const mongoose =require("mongoose");

const CommentSchema = mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  blog: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "Blogs"
  },
  body: {
    type: String,
    maxLength: 144
  },
  like:{
    type: Number,
    default:0
  }
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model("Comment", CommentSchema);

module.exports= Comment;