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

const upload = multer();

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
      const result = await applicationsCollection.find().sort({ submissionDate: -1 }).toArray();
      res.send(result);
    });

    app.get('/checkApplicants', async (req, res) => {
      const urlQuery = req.query?.phone;
      const query = { phone: urlQuery };
      const result = await applicationsCollection.findOne(query);
      if (result) res.send('present');
      else res.send('absent');
    });

    app.get('/searchResult', async (req, res) => {
      const urlQuery = req.query?.search;
      console.log(urlQuery);
      const query = { name: { $regex: `.*${urlQuery}.*`, $options: 'i' } };
      const result = await applicationsCollection.find(query).toArray();
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
      const cursor = applicationsCollection.find(query).sort({ submissionDate: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/approved', async (req, res) => {
      const query = { status: 'approved' };
      const cursor = applicationsCollection.find(query).sort({ submissionDate: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/approvedStatus', async (req, res) => {
      const query = { status: 'approved' };
      const options = {
        projection: { amount: 1, area: 1, areaBangla: 1, approveDate: 1, approveBanglaDate: 1, _id: 0 },
      };
      const cursor = applicationsCollection.find(query, options).sort({ submissionDate: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/slider', async (req, res) => {
      const query = { status: 'approved' };
      const options = {
        sort: { approveDate: -1 },
        projection: {
          _id: 0,
          amount: 1,
          approveBanglaDate: 1,
          approveDate: 1,
          area: 1,
          areaBangla: 1,
        },
      };
      const result = await applicationsCollection.find(query, options).limit(12).toArray();
      res.send(result);
    });

    app.post('/applications', fileUpload, async (req, res) => {
      const applications = req.body;
      try {
        const result = await applicationsCollection.insertOne(applications);
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
      }
    });

    app.put('/applications/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateRequest = req.body;
      updateRequest.amount = parseInt(updateRequest.amount);
      const request = {
        $set: {
          status: updateRequest.status,
          amount: updateRequest.amount,
          area: updateRequest.area,
          areaBangla: updateRequest.areaBangla,
          approveDate: updateRequest.formatedDate,
          approveBanglaDate: updateRequest.formatedBanglaDate,
        },
      };
      const result = await applicationsCollection.updateOne(filter, request, options);
      const latestRequest = await applicationsCollection.find(filter).toArray();
      res.send({ result, latestRequest });
    });

    app.get('/paginated-requests', async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const status = req.query.status;
      const size = 20;
      const query = { status };
      const startIndex = (page - 1) * size;
      try {
        const queryTotal = await applicationsCollection.countDocuments(query);
        const total = await applicationsCollection.estimatedDocumentCount();
        const result = await (status ? applicationsCollection.find(query).sort({ submissionDate: -1 }).skip(startIndex).limit(size).toArray() : applicationsCollection.find().sort({ submissionDate: -1 }).skip(startIndex).limit(size).toArray());
        res.json({
          queryTotal: queryTotal,
          items: total,
          data: result,
        });
      } catch (error) {
        console.log('Error fetching paginated Data from MongoDB', error);
        res.status(500).send(error.message);
      }
    });

    app.delete('/hudayDelete', async (req, res) => {
      const result = await applicationsCollection.deleteMany({ status: 'approved' });
      res.send(result);
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
