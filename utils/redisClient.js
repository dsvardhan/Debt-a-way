// const { createClient } = require('redis');
// require('dotenv').config();

// let redisClient;

// async function createRedisClient() {
//     if (!redisClient) {
//         const redisClient = createClient({
//             url: `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
//           });
//         redisClient.on('error', (err) => console.log('Redis Client Error', err));
//         await redisClient.connect().catch(console.error);
//         console.log('Redis client connected successfully');
//     }
//     return redisClient;
// }

// module.exports = 
const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: `redis://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redisClient.connect().catch(console.error);

module.exports = redisClient;

