
const { default: axios } = require('axios');
const News = require('../models/newsAdmin.model');
const User = require('../models/user.model');
const { uploadOnCloudinary } = require('../utils/cloudnary');
const moment = require('moment');
const Protfolio = require('../models/protfolio.model');
const cloudinary = require("cloudinary").v2;


//creating news
exports.createNews = async (req, res) => {
    try {
        const { symbol, newsTitle, newsDescription, source, isPaid, lang } = req.body;
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
        if (!newsTitle || !newsDescription) {
            return res.status(400).json(
                {
                    status: false,
                    message: 'All fields are required',
                }
            );

        }
        let newsImage
        if (req.file) {
            try {
                const image = await uploadOnCloudinary(req.file.buffer, 'news');
                newsImage = image.secure_url;
            } catch (error) {
                console.log(error)
                return res.status(400).json({
                    status: false,
                    message: 'Failed to upload image',
                });
            }
        }
        // Create a new news item       
        const news = new News({
            newsTitle,
            newsDescription,
            newsImage,
            date,
            // author,
            symbol,
            source,
            isPaid,
            lang
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


exports.uploadCSV = async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const results = [];

    try {
        const stream = Readable.from(req.file.buffer);
        stream
            .pipe(csv())
            .on('data', (data) => {
                try {
                    results.push({
                        newsTitle: data.newsTitle,
                        newsDescription: data.newsDescription,
                        date,
                        // author,
                        symbol: data.symbol,
                        source: data.source,
                        isPaid: data.isPaid,
                        lang: data.lang
                    });
                } catch (parseErr) {
                    // Log or skip malformed row
                    console.error('Skipping invalid row:', data, parseErr);
                }
            })
            .on('end', async () => {
                try {
                    await News.insertMany(results, { ordered: false }); // ordered:false skips duplicates/errors
                    res.status(201).json({ message: 'CSV processed successfully', count: results.length });
                } catch (dbErr) {
                    console.error('DB Error:', dbErr);
                    res.status(500).json({ error: 'Error saving data to DB' });
                }
            });
    } catch (err) {
        console.error('Stream Error:', err);
        res.status(500).json({ error: 'Failed to process CSV upload' });
    }
};

//getting all news  
exports.getAllNews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;         // Default: page 1
        const limit = parseInt(req.query.limit) || 10;      // Default: 10 items per page
        const search = req.query.search || '';              // Search keyword

        const skip = (page - 1) * limit;
        const { symbol } = req.query;



        // Create search filter
        const filter = {
            newsTitle: { $regex: search, $options: 'i' },      // Case-insensitive partial match
            source: "admin"
        };
        if (symbol) {
            filter.symbol = symbol
        }

        // Total count for pagination
        const totalNews = await News.countDocuments(filter);

        // Fetch news
        const news = await News.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        // .populate('author', 'name');  // Only populate author's name

        return res.status(200).json({
            status: true,
            message: 'News fetched successfully',
            data: news,
            meta: {
                total: totalNews,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalNews / limit),
            }
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
        const { newsTitle, newsDescription, symbol, isPaid, lang } = req.body;
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

        if (req.file) {
            try {
                await cloudinary.uploader.destroy(existingNews.newsImage)
                const image = await uploadOnCloudinary(req.file.buffer, 'news');
                existingNews.newsImage = image.secure_url;
            } catch (error) {
                return res.status(400).json({
                    status: false,
                    message: 'Failed to upload image',
                });
            }
        }

        // Update the news item
        if (newsTitle) existingNews.newsTitle = newsTitle;
        if (newsDescription) existingNews.newsDescription = newsDescription;
        if (symbol) existingNews.symbol = symbol;
        if (isPaid) existingNews.isPaid = isPaid;
        if (lang) existingNews.lang = lang;

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
        // await cloudinary.uploader.destroy(news.newsImage);
        await News.findByIdAndDelete({ _id: newsID });
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



exports.merketNewsFromAPi = async (req, res) => {
    try {
        const { symbol, category = "general" } = req.query;
        let news = [];

        if (symbol) {
            const to = moment().format("YYYY-MM-DD");
            const from = moment().subtract(30, "days").format("YYYY-MM-DD");

            const apiResponse = await axios.get(`https://finnhub.io/api/v1/company-news`, {
                params: {
                    symbol,
                    from,
                    to,
                    token: process.env.FINHUB_API_KEY,
                },
            });

            news = apiResponse.data;
        } else {
            const apiResponse = await axios.get(`https://finnhub.io/api/v1/news`, {
                params: {
                    category,
                    token: process.env.FINHUB_API_KEY,
                },
            });

            news = apiResponse.data;
        }

        return res.status(200).json({
            status: true,
            message: "News fetched successfully",
            data: news,
        });
    } catch (error) {
        console.error("Error fetching news from API:", error);
        return res.status(500).json({
            status: false,
            message: "Error fetching news from API",
            error: error.message,
        });
    }
};


exports.deepReSearch = async (req, res) => {
    try {
        const { symbol } = req.query;
        const filter = { source: "deep-research" }
        if (symbol) {
            filter.symbol = symbol
        }
        const news = await News.find(filter).sort({ createdAt: -1 }).limit(10);
        return res.status(200).json({
            status: true,
            message: 'News fetched successfully',
            data: news
        })

    } catch (error) {
        console.error('Error fetching news from database:', error);
        return res.status(500).json(
            {
                status: false,
                message: 'Error fetching news from database',
                error: error.message,
            })

    }
}

exports.getMultipleCompanyNews = async (req, res) => {

    const { protfolioId } = req.body; // e.g., ["AAPL", "GOOGL"]

    const portfolio = await Protfolio.findById(protfolioId);
    // console.log(portfolio)
    if (!portfolio) {
        return res.status(400).json({ error: 'Portfolio not found' });
    }

    if (!Array.isArray(portfolio.stocks) || portfolio.stocks === 0) {
        return res.status(400).json({ error: 'symbols array is required in body' });
    }


    const from = moment().subtract(7, 'days').format('YYYY-MM-DD');
    const to = moment().format('YYYY-MM-DD');

    let allNews = [];

    await Promise.all(
        portfolio.stocks.map(async (stcoks) => {
            console.log(stcoks)
            try {
                const { data } = await axios.get('https://finnhub.io/api/v1/company-news', {
                    params: {
                        symbol: stcoks.symbol.toUpperCase(),
                        from,
                        to,
                        token: process.env.FINHUB_API_KEY
                    }
                });

                // Add symbol to each article for traceability
                const taggedNews = data.map(article => ({
                    ...article,
                    symbol: stcoks.symbol.toUpperCase()
                }));

                allNews = allNews.concat(taggedNews);
            } catch (err) {
                console.warn(`Error fetching news for ${symbol}:`, err.message);
            }
        })
    );

    // Sort all news by datetime descending and take the most recent 30
    allNews.sort((a, b) => b.datetime - a.datetime);
    const recentNews = allNews.slice(0, 30);

    res.json(recentNews);

};
