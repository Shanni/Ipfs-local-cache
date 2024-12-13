const IPFSCache = require('./ipfs-cache');

async function main() {
    const cache = new IPFSCache({
        maxCacheAge: 1 * 60 * 60 * 1000, // 1 hour
        cacheDir: './ipfs-cache-data'
    });

    try {
        // Example CID - replace with your actual CID
        const cid = 'QmExample...';

        console.time('First fetch');
        const content1 = await cache.get(cid);
        console.timeEnd('First fetch');
        console.log('Content length:', content1.length);

        // Second fetch should be faster (from cache)
        console.time('Second fetch');
        const content2 = await cache.get(cid);
        console.timeEnd('Second fetch');
        console.log('Content length:', content2.length);

    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 