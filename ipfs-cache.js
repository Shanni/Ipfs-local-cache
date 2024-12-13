const IPFS = require('ipfs-http-client');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

class IPFSCache {
    constructor(options = {}) {
        // Initialize IPFS client
        this.ipfs = IPFS.create(options.ipfsOptions || {
            host: 'localhost',
            port: '5001',
            protocol: 'http'
        });

        // Cache directory configuration
        this.cacheDir = options.cacheDir || path.join(process.cwd(), '.ipfs-cache');
        this.maxCacheAge = options.maxCacheAge || 24 * 60 * 60 * 1000; // 24 hours default
        
        // Ensure cache directory exists
        this.initializeCache();
    }

    async initializeCache() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create cache directory:', error);
        }
    }

    getCacheFilePath(cid) {
        // Create a hash of the CID to use as filename
        const hash = crypto.createHash('sha256').update(cid).digest('hex');
        return path.join(this.cacheDir, hash);
    }

    async getFromCache(cid) {
        const filePath = this.getCacheFilePath(cid);
        try {
            const stats = await fs.stat(filePath);
            
            // Check if cache is expired
            if (Date.now() - stats.mtime.getTime() > this.maxCacheAge) {
                return null;
            }

            const content = await fs.readFile(filePath);
            return content;
        } catch (error) {
            return null;
        }
    }

    async saveToCache(cid, content) {
        const filePath = this.getCacheFilePath(cid);
        try {
            await fs.writeFile(filePath, content);
        } catch (error) {
            console.error('Failed to save to cache:', error);
        }
    }

    async get(cid) {
        // Try to get content from cache first
        const cachedContent = await this.getFromCache(cid);
        if (cachedContent) {
            console.log('Cache hit for CID:', cid);
            return cachedContent;
        }

        console.log('Cache miss for CID:', cid);
        
        // If not in cache, get from IPFS
        const chunks = [];
        for await (const chunk of this.ipfs.cat(cid)) {
            chunks.push(chunk);
        }
        const content = Buffer.concat(chunks);

        // Save to cache
        await this.saveToCache(cid, content);

        return content;
    }

    async clearCache() {
        try {
            const files = await fs.readdir(this.cacheDir);
            await Promise.all(
                files.map(file => 
                    fs.unlink(path.join(this.cacheDir, file))
                )
            );
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }
}

module.exports = IPFSCache; 