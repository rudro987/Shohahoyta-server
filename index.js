const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const upload = multer()

const fileUpload = upload.fields([
  { name: 'mainFile', maxCount: 1 },
  { name: 'others', maxCount: 3 },
]);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.uviemuc.mongodb.net/applicationsDb?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const applicationsCollection = client.db('applicationsDb').collection('applications');

    app.get('/applications', async (req, res) => {
      const result = await applicationsCollection.find().toArray();
      res.send(result);
    });


    app.get('/applications/:id', async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send('Invalid ObjectId');
      }

      const query = { _id: new ObjectId(id) };
      const result = await applicationsCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/pending', async (req, res) => {
      const query = { status: 'pending' };
      const cursor = applicationsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/approved', async (req, res) => {
      const query = { status: 'approved' };
      const cursor = applicationsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post('/applications', fileUpload, async (req, res) => {
      const applications = req.body;  
      try {
        const result = await applicationsCollection.insertOne(applications);
        res.send(result);
      } catch (error) {
        console.log(error)
        res.status(400).send(error.message);
      }
    });

    app.put('/applications/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateRequest = req.body;
      const request = {
        $set: {
          status: updateRequest.status,
          date: updateRequest.date,
        },
      };
      const result = await applicationsCollection.updateOne(filter, request, options);
      const latestRequest = await applicationsCollection.find(filter).toArray();
      res.send({ result, latestRequest });
    });

    // await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensure that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Shohayota server is running!');
});

app.listen(port, () => {
  console.log(`Shohayota server is running on port ${port}`);
});
