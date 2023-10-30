const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
let count = 1;

const UPLOAD_FOLDER = "./uploads/"

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, UPLOAD_FOLDER);
    },
    filename: function (req, file, cb) {
      const modifiedFileName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${Math.round(Math.random() * 1E9)}_${modifiedFileName}`);
    },
  }),
});

const fileUpload = upload.fields([
  { name: "mainFile", maxCount: 1 },
  { name: "others", maxCount: 6 },
]);

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

const uri = `mongodb+srv://${dbUser}:${dbPass}@cluster1.uviemuc.mongodb.net/applicationsDb?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const applicationsCollection = client.db("applicationsDb").collection("applications");

    app.get("/applications", async (req, res) => {
      const cursor = applicationsCollection.find({status: {$eq: "pending"}});
      try {
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send(error.message);
      }
  })
    

    app.post("/applications", fileUpload, async (req, res) => {
      const applications = req.body;
      const image = req.files['mainFile'][0];
      const images = req.files['others'];

      try {
        const imagePaths = images?.map((image) => image.path);
        const result = await applicationsCollection.insertOne({
          ...applications,
          image: image.path, 
          others: imagePaths, 
        });
        res.send(result);
      } catch (error) {
        res.status(400).send(error.message);
      }
    });

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensure that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Shohayota server is running!");
});

app.listen(port, () => {
  console.log(`Shohayota server is running on port ${port}`);
});
