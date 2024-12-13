const express = require('express');
const IPFS = require('ipfs-core');
const NodeCache = require('node-cache');
const IPFSCache = require('./ipfs-cache');

// Initialize Express App and IPFS Cache
const app = express();
const memoryCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // In-memory cache with 1-hour TTL
const ipfsCache = new IPFSCache({
    maxCacheAge: 1 * 60 * 60 * 1000, // 1 hour
    cacheDir: './ipfs-cache-data'
});

let ipfs;
(async () => {
    ipfs = await IPFS.create();
    console.log('IPFS node started');
})();

// Middleware to check memory cache
app.use(async (req, res, next) => {
    const cachedData = memoryCache.get(req.url);
    if (cachedData) {
        console.log('Memory cache hit for:', req.url);
        return res.json(cachedData);
    }
    console.log('Memory cache miss for:', req.url);
    next();
});

// Route to fetch content from IPFS
app.get('/fetch/:cid', async (req, res) => {
    const cid = req.params.cid;
    try {
        // Try to get from file cache first
        const content = await ipfsCache.get(cid);
        const data = content.toString();

        // Store in memory cache
        memoryCache.set(req.url, data);

        res.send(data);
    } catch (err) {
        console.error('Error fetching from IPFS:', err);
        res.status(500).send('Error fetching data');
    }
});

// Route to clear caches
app.post('/clear-cache', async (req, res) => {
    try {
        memoryCache.flushAll();
        await ipfsCache.clearCache();
        res.send({ message: 'Caches cleared successfully' });
    } catch (err) {
        console.error('Error clearing caches:', err);
        res.status(500).send('Error clearing caches');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 