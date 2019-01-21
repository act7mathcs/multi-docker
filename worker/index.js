// This is the worker file that connects to Redis and calculates the Fibonaci number.

const keys = require('./keys'); // we keep the hostname and port in a separate file
const redis = require('redis');
// Connect to Redis client.
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000 // try to reconnect every second if it loses the connection
});
const sub = redisClient.duplicate(); // make a duplicate of the Redis client

// Calculate the Fibonacci values. Uses a recursive solution (which is slow, so it gives a reason to have a second worker process).
function fib(index) {
    if (index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
}

// Watch Redis so any time a new value shows up, we'll run this callback function (which calculates a new Fibonacci value). The resulting value is inserted (back into Redis) into a hash called 'values' where the key is the message variable and the value is the Fibonacci value.
sub.on('message', (channel, message) => {
    redisClient.hset('values', message, fib(parseInt(message)));
});
sub.subscribe('insert'); // anytime someone inserts a new value into Redis, we will get the value and attempt to calculate the Fibonacci for it and toss that value back into the Redis instance


