const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const uuid = require('uuid').v4;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

<<<<<<< HEAD
const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const { originalname } = file;
    cb(null, `${uuid()}-${originalname}`);
  },
});
=======
const upload = multer()
>>>>>>> 6813c38cd9b3b042cfee3edacc65884b48275c48

const upload = multer({ storage });

const multiUpload = upload.fields([
  { name: 'coverPhoto', maxCount: 1 },
  { name: 'gallery', maxCount: 3 },
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

    app.post('/submission', multiUpload, async (req, res) => {
      res.send({ status: 'success' });
    });

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

<<<<<<< HEAD
    // app.post('/applications', fileUpload, async (req, res) => {
    //   const applications = req.body;
    //   const serverAddress = `${req.protocol}://${req.get('host')}/`;
    //   const image = serverAddress + req.files['mainFile'][0].path.replace(/\\/g, '/');
    //   console.log(req.files['mainFile'][0]);
    //   const images = req.files['others'];
    //   const imagesPath = images?.map((image) => serverAddress + image.path.replace(/\\/g, '/'));

    //   try {
    //     const result = await applicationsCollection.insertOne({
    //       ...applications,
    //       image: image,
    //       others: imagesPath,
    //       createdAt: new Date(),
    //     });
    //     res.send(result);
    //   } catch (error) {
    //     console.log(error);
    //     res.status(400).send(error.message);
    //   }
    // });
=======
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
>>>>>>> 6813c38cd9b3b042cfee3edacc65884b48275c48

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
