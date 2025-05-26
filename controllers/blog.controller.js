
const blogsAdmin = require("../models/blogsAdmin.model");
const User = require("../models/user.model");
const { uploadOnCloudinary } = require("../utils/cloudnary");
const cloudinary = require("cloudinary").v2;

exports.createblog = async (req, res) => {
    try {
        const { blogTitle, blogDescription } = req.body;
        // const author = req.user._id; // Assuming you have user authentication middleware
        // const existingAd = await blogsAdmin.findOne({ blogTitle });
        // if (existingAd) {
        //     return res.status(400).json({
        //         status: false,
        //         message: 'blog with this title already exists',
        //     });
        // }
        // Validate the request body
        if (!blogTitle || !blogDescription) {
            return res.status(400).json({
                status: false,
                message: 'All fields are required',
            });
        }
        let imageLink
        if (req.file) {
            try {
                const image = await uploadOnCloudinary(req.file.buffer, 'blog');
                imageLink = image.secure_url;
            } catch (error) {
                return res.status(400).json({
                    status: false,
                    message: 'Failed to upload image',
                });
            }
        }
        // Create a new ad item       
        const blog = new blogsAdmin({
            blogTitle,
            blogDescription,
            imageLink,
            // author,
        });
        await blog.save();
        return res.status(201).json({
            status: true,
            message: 'blog created successfully',
            data: blog,
        });
    }
    catch (error) {
        console.error('Error creating blog:', error);
        return res.status(500).json({
            status: false,
            message: 'Error creating blog',
            error: error.message,
        });
    }
};

//_______________________________________

//getting all blog

exports.getAllblog = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const filter = {
        $or: [
            { blogTitle: { $regex: search, $options: 'i' } },
        ]
    }
    const blog = await blogsAdmin.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalblog = await blogsAdmin.countDocuments(filter);
    const totalPages = Math.ceil(totalblog / limit);
    if (blog.length === 0) {
        return res.status(404).json({
            status: false,
            message: 'No blog found',
        });
    }

    res.status(200).json({
        status: true,
        message: 'blog fetched successfully',
        data: blog,
        meta: {
            total: totalblog,
            page: page,
            limit: limit,
            totalPages: totalPages,
        }
    });
};

//_______________________________________

//getting single ad

exports.getSingleblog = async (req, res) => {
    try {
        const id = req.params.id;
        const blog = await blogsAdmin.findById(id);
        if (!blog) {
            return res.status(404).json({
                status: false,
                message: 'blog not found',
            });
        }
        res.status(200).json({
            status: true,
            message: 'blog fetched successfully',
            data: blog,
        });
    }
    catch (error) {
        console.error('Error fetching blog:', error);
        return res.status(500).json({
            status: false,
            message: 'Error fetching blog',
            error: error.message,
        });
    }
};


//_______________________________________

//updating ad

exports.updateblog = async (req, res) => {
    try {
        const id = req.params.id;
        const { blogTitle, blogDescription } = req.body;
        // const author = req.user._id; // Assuming you have user authentication middleware
        const existingAd = await blogsAdmin.findById(id);
        if (!existingAd) {
            return res.status(404).json({
                status: false,
                message: 'blog not found',
            });
        }
        // Validate the request body
        if (!blogTitle || !blogDescription) {
            return res.status(400).json({
                status: false,
                message: 'All fields are required',
            });
        }
        if (req.file) {
            try {
                await cloudinary.uploader.destroy(existingAd.imageLink)
                const image = await uploadOnCloudinary(req.file.buffer, 'blog');
                existingAd.imageLink = image.secure_url;
            } catch (error) {
                return res.status(400).json({
                    status: false,
                    message: 'Failed to upload image',
                });
            }
        }

        // Update the ad item       
        existingAd.blogTitle = blogTitle;
        existingAd.blogDescription = blogDescription;
        // existingAd.author = author;

        await existingAd.save();
        return res.status(200).json({
            status: true,
            message: 'blog updated successfully',
            data: existingAd,
        });
    }
    catch (error) {
        console.error('Error updating blog:', error);
        return res.status(500).json({
            status: false,
            message: 'Error updating blog',
            error: error.message,
        });
    }
}

//_______________________________________

//deleting ad

exports.deleteblog = async (req, res) => {
    try {
        const id = req.params.id;
        const blog = await blogsAdmin.findByIdAndDelete(id);
        if (!blog) {
            return res.status(404).json({
                status: false,
                message: 'blog not found',
                data: "",
            });
        }
        res.status(200).json({
            status: true,
            message: 'blog deleted successfully',
            data: "",
        });
    }
    catch (error) {
        console.error('Error deleting blog:', error);
        return res.status(500).json({
            status: false,
            message: 'Error deleting blog',
            error: error.message,
        });
    }
}