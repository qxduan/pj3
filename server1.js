
const express = require('express');
const { MongoClient } = require('mongodb');
const helmet = require('helmet');
const cors = require('cors');
const app = express();
const port = 3001;

// Use CORS for all routes
app.use(cors());

// Helmet for setting Content Security Policy
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "http://localhost:3001", "data:"],
    },
  })
);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Use environment variable for MongoDB URI
const mongoUrl = process.env.MONGO_URI;
const dbName = 'pj3';

async function main() {
  let client;
  
  try {
    // Connect to the MongoDB client
    client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const db = client.db(dbName);
    const productsCollection = db.collection('product');
    const ordersCollection = db.collection('order');

    app.use(express.json());

    // Products Route
    app.get('/api/products', async (req, res) => {
      try {
        const products = await productsCollection.find({}).toArray();
        res.json(products);
      } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).send('Error fetching products');
      }
    });

    // Orders Route
    app.get('/api/orders', async (req, res) => {
      try {
        const orders = await ordersCollection.find({}).sort({ orderDate: -1 }).toArray(); // Sort by orderDate descending
        res.json(orders);
      } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching orders');
      }
    });
    

    // Route to handle creation of a new order
    app.post('/api/orders', async (req, res) => {
      try {
        const orderData = req.body;

        // Enhanced data validation
        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
          return res.status(400).send('Error: No items in the order');
        }
        if (orderData.items.length > 5) {
          return res.status(400).send('Error: More than 5 items in an order');
        }

        const result = await ordersCollection.insertOne(orderData);
        res.status(201).json(result.ops[0]);
      } catch (err) {
        console.error('Error saving order:', err.message);
        res.status(500).send('Error saving order');
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
  }
}

main().catch(console.error);
