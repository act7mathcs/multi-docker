// This file is located at: Desktop/Aarons_Folder/Web_Dev/Docker/complex/server.

// This file operates the Express server, which listens to the React front-end and communicates with the Postgres and Redis back-ends. Note that we created the package.json manually.

const keys = require('./keys');

// Express set-up.
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors()); // allows us to make requests from one domain react is on to another domain that express is on
app.use(bodyParser.json()); // parse the body of incoming post requests from react into a json value that express can work with

// Postgres set-up.
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection.'));
// Create a table to store the index values we store in our postgres database. The table name is 'values' and the column name is 'number'.
pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err => console.log(err)); // if anything goes wrong in creating the table, show the error

// Redis set-up.
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate(); // create a duplicate connection

// Express route handlers.
app.get('/', (req, res) => {
    res.send('Hi there.');
});

app.get('/values/all', async (req, res) => { // query our postgres database
    const values = await pgClient.query('SELECT * FROM values');
    res.send(values.rows); // sends back only the data (not the meta data)
});

app.get('/values/current', async (req, res) => { // redis doesn't have promise support, so we use callbacks instead of async await
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    });
});

app.post('/values', async (req, res) => { // when a new value is posted
    const index = req.body.index;
    if (parseInt(index) > 40) {
        return res.status(422).send('Index too high.');
    }
    redisClient.hset('values', index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
    res.send({ working: true });
});

app.listen(5000, err => {
    console.log('Listening on port 5000...')
});
