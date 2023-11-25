const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.port || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wjgws1x.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // TODO: remove the client connect
    // await client.connect();
    // Send a ping to confirm a successful connection
    const galleryCollection = client.db("bodyPulse").collection("gallery");

    app.get("/gallery", async (req, res) => {
      const { offset = 0, limit = 12 } = req.query;
      const result = await galleryCollection
        .find()
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Fitness Tracker Website");
});
app.listen(port, () => {
  console.log(`server site start the port ${port}`);
});
