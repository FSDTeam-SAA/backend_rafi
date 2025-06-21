const qualityStocks = require("../models/qualityStcoks.model");


// DELETE /quality-stocks
exports.deleteStockFromType = async (req, res) => {
  try {
    const { type, symbol } = req.body;

    if (!type || !symbol) {
      return res.status(400).json({ error: 'Type and symbol are required' });
    }

    const typeDoc = await qualityStocks.findOne({ type });

    if (!typeDoc) {
      return res.status(404).json({ error: 'Stock type not found' });
    }

    const originalLength = typeDoc.stocks.length;
    typeDoc.stocks = typeDoc.stocks.filter(
      (stock) => stock.symbol.toUpperCase() !== symbol.toUpperCase()
    );

    if (typeDoc.stocks.length === originalLength) {
      return res.status(404).json({ error: 'Symbol not found in this type' });
    }

    await typeDoc.save();
    return res.status(200).json({ message: 'Stock removed successfully', data: typeDoc });

  } catch (error) {
    console.error('Delete stock error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /quality-stocks
exports.addStockToType = async (req, res) => {
  try {
    const { type, symbol } = req.body;

    if (!type || !symbol) {
      return res.status(400).json({ error: 'Type and symbol are required' });
    }

    const existingType = await qualityStocks.findOne({ type });

    if (existingType) {
      const isDuplicate = existingType.stocks.some(stock => stock.symbol.toUpperCase() === symbol.toUpperCase());

      if (isDuplicate) {
        return res.status(409).json({ message: 'Stock symbol already exists in this type' });
      }

      existingType.stocks.push({ symbol: symbol.toUpperCase() });
      await existingType.save();
      return res.status(200).json({ message: 'Stock added to existing type', data: existingType });
    }

    // If type doesn't exist, create it
    const newEntry = new qualityStocks({
      type,
      stocks: [{ symbol: symbol.toUpperCase() }]
    });
    await newEntry.save();

    return res.status(201).json({ message: 'New type created with stock', data: newEntry });

  } catch (error) {
    console.error('Add stock error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
