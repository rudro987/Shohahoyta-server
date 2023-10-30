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
app.use('/uploads', express.static('uploads'));

const UPLOAD_FOLDER = './uploads/';

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, UPLOAD_FOLDER);
    },
    filename: function (req, file, cb) {
      const modifiedFileName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${Date.now()}_${Math.round(Math.random() * 1e9)}_${modifiedFileName}`);
    },
  }),
});

const fileUpload = upload.fields([
  { name: 'mainFile', maxCount: 1 },
  { name: 'others', maxCount: 6 },
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
      const query = { _id: new ObjectId(id) };
      const result = await applicationsCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/applications/pending', async (req, res) => {
      const cursor = applicationsCollection.find({ status: { $eq: 'pending' } });
      try {
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send(error.message);
      }
    });

    app.get('/applications/active', async (req, res) => {
      const cursor = applicationsCollection.find({ status: { $eq: 'active' } });
      try {
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send(error.message);
      }
    });

    app.post('/applications', fileUpload, async (req, res) => {
      const applications = req.body;
      const serverAddress = `${req.protocol}://${req.get('host')}/`;
      const image = serverAddress + req.files['mainFile'][0].path.replace(/\\/g, '/');
      const images = req.files['others'];
      const imagesPath = images.map((image) => serverAddress + image.path.replace(/\\/g, '/'));

      try {
        // const imagePaths = images.map((image) => image.path);
        const result = await applicationsCollection.insertOne({
          ...applications,
          image: image,
          others: imagesPath,
        });
        res.send(result);
      } catch (error) {
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
        },
      };
      const result = await applicationsCollection.updateOne(filter, request, options);
      console.log(result);
      res.send(result);
    });

    await client.connect();
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
