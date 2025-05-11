const mongoose = require("mongoose");

const youtubeVideosSchema = new mongoose.Schema(
  {
    videoTitle: {
      type: String,
    },
    videoLink: {
      type: String,
    },
    publish: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const youtubeVideos = mongoose.model("YoutubeVideos", youtubeVideosSchema);
module.exports = youtubeVideos;
