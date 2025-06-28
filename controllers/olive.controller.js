
const csv = require('csv-parser');
const fs = require('fs');
const Olive = require('../models/stcoks.olive.model');
const { Readable } = require('stream');



exports.uploadOlive = async (req, res) => {
    try {
        const { symbol, fair_value, financial_health, compatitive_advantage } = req.body;
        const updatedOlive = await Olive.findOneAndUpdate(
            { symbol: symbol.toUpperCase() },
            { symbol: symbol.toUpperCase(), fair_value, financial_health, compatitive_advantage },
            { new: true, upsert: true }
        );
        res.status(201).json(updatedOlive);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create olive stock' });
    }
}

// Upload CSV file
exports.uploadCSV = async (req, res) => {
    const results = [];
    try {
        const stream = Readable.from(req.file.buffer);
        stream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                const upserts = results.map(row =>
                    Olive.findOneAndUpdate(
                        { symbol: row.Ticker.toUpperCase() },
                        {
                            symbol: row.Ticker.toUpperCase(),
                            fair_value: Number( row.FairValue ) ? Number( row.FairValue) : 0,
                            financial_health: row.FinancialHealth.toLowerCase(),
                            compatitive_advantage: row.CompetitiveAdvantage.toLowerCase(),
                            ComplianceStatus: row.ComplianceStatus,
                            QualitativeStatus: row.QualitativeStatus,
                            QualitativeReason: row.QualitativeReason,
                            QuantitativeStatus: row.QuantitativeStatus,
                            QuantitativeReason: row.QuantitativeReason,
                        },
                        { upsert: true, new: true }
                    )
                );

                await Promise.all(upserts);
                res.status(201).json({ message: 'CSV processed successfully', count: results.length });
            });
    } catch (err) {
        console.log(err.message)
        res.status(500).json({ error: 'Failed to process CSV upload' });
    }
}

// Read all

exports.getAllOlive = async (req, res) => {
    try {
        const olives = await Olive.find();
        res.json(olives);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch olive stocks' });
    }
}

// // Update by ID
// router.put('/olive/:id', async (req, res) => {
//   try {
//     const olive = await Olive.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.json(olive);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to update olive stock' });
//   }
// });

// Delete by ID

exports.deleteOlive = async (req, res) => {
    try {
        await Olive.findByIdAndDelete(req.params.id);
        res.json({ message: 'Olive stock deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete olive stock' });
    }
}


