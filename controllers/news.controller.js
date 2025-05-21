
const News = require('../models/newsAdmin.model');
const User = require('../models/user.model');


//creating news
exports.createNews = async (req, res) => {
    try {
        const { newsTitle, newsDescription, tickers } = req.body;
        // const author = req.user._id; 
        const date = new Date();
        const existingNews = await News.findOne({ newsTitle });
        if (existingNews) {
            return res.status(400).json(
                {
                    status: false,
                    message: 'News with this title already exists',
                }
            );
        }
        // Validate the request body
        if (!newsTitle || !newsDescription || !newsImage || !tickers) {
            return res.status(400).json(
                {
                    status: false,
                    message: 'All fields are required',
                }
            );

        }
        // Create a new news item       
        const news = new News({
            newsTitle,
            newsDescription,
            // newsImage,
            date,
            tickers,
            // author,
        });
        await news.save();
        return res.status(201).json(
            {
                status: true,
                message: 'News created successfully',
                data: news,
            }
        );
    }
    catch (error) {
        console.error('Error creating news:', error);
        return res.status(500).json(
            {
                status: false,
                message: 'Error creating news',
                error: error.message,
            }
        );
    }
}

//getting all news  
exports.getAllNews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;         // Default: page 1
        const limit = parseInt(req.query.limit) || 10;      // Default: 10 items per page
        const search = req.query.search || '';              // Search keyword

        const skip = (page - 1) * limit;

        // Create search filter
        const filter = {
            newsTitle: { $regex: search, $options: 'i' }       // Case-insensitive partial match
        };

        // Total count for pagination
        const totalNews = await News.countDocuments(filter);

        // Fetch news
        const news = await News.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        // .populate('author', 'name');  // Only populate author's name

        return res.status(200).json({
            status: true,
            message: 'News fetched successfully',
            currentPage: page,
            limit,
            totalPages: Math.ceil(totalNews / limit),
            totalNews,
            data: news
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message,
            error
        });
    }
};
//getting single news       

exports.getSingleNews = async (req, res) => {
    try {
        const newsId = req.params.id;
        const news = await News.findById(newsId);
        // .populate('author', 'name');
        if (!news) {
            return res.status(404).json(
                {
                    status: false,
                    message: 'News not found',
                }
            );
        }
        return res.status(200).json(
            {
                status: true,
                message: 'News fetched successfully',
                data: news,
            }
        );
    } catch (error) {
        console.error('Error fetching news:', error);
        return res.status(500).json(
            {
                status: false,
                message: 'Error fetching news',
                error: error.message,
            }
        );
    }
}




//updating news
exports.updateNews = async (req, res) => {
    try {
        const newsId = req.params.id;
        const { newsTitle, newsDescription, newsImage, tickers } = req.body;
        // const author = req.user._id;
       
        const existingNews = await News.findById(newsId);
        if (!existingNews) {
            return res.status(404).json(
                {
                    status: false,
                    message: 'News not found',
                }
            );
        }

        // Update the news item
        existingNews.newsTitle = newsTitle;
        existingNews.newsDescription = newsDescription;
        existingNews.newsImage = newsImage;
      


        existingNews.tickers = tickers;
        // existingNews.author = author;
        await existingNews.save();
        return res.status(200).json(
            {
                status: true,
                message: 'News updated successfully',
                data: existingNews,
            }
        );
    }
    catch (error) {
        console.error('Error updating news:', error);
        return res.status(500).json(
            {
                status: false,
                message: 'Error updating news',
                error: error.message,
            }
        );
    }
}

//deleting news

exports.deleteNews = async (req, res) => {
    try {
        const newsID = req.params.id;
        const news = await News.findById(newsID);
        if (!news) {
            return res.status(404).json({
                status: false,
                message: 'News not found',
            })
        }
        await News.findByIdAndDelete(newsID);
        return res.status(200).json({
            status: true,
            message: 'News deleted successfully',
            data: news,
        })
    }
    catch (error) {
        console.error('Error updating news:', error);
        return res.status(500).json(
            {
                status: false,
                message: 'Error updating news',
                error: error.message,
            }
        );
    }
}