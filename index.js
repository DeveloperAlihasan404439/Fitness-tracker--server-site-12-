require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.port || 5000;
const stripe = require("stripe")(process.env.PAYMENT_SK);

app.use(cors());
// app.use(express.static("public"));
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
    const userCollection = client.db("bodyPulse").collection("user");
    const galleryCollection = client.db("bodyPulse").collection("gallery");
    const subscribersCollection = client.db("bodyPulse").collection("subscribers");
    const tarinersCollection = client.db("bodyPulse").collection("tariners");
    const tarinerConfrimCollection = client.db("bodyPulse").collection("confrim_Tariners");
    const classCollection = client.db("bodyPulse").collection("allClass");
    const memborCollection = client.db("bodyPulse").collection("user_book_class");
    const paymentCollection = client.db("bodyPulse").collection("user_book_payment");

    // -------------------------------User api start--------------------------------------------
    // admin dashboard
    app.get("/users",async (req, res) => {
      try {
        const result = await userCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.put("/users/:id", async (req, res) => {
      try {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          name: req.body.name,
          email: req.body.email,
          location: req.body.location,
          phone: req.body.phone,
          age: req.body.age,
          gender: req.body.gender,
          photo: req.body.photo,
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    // admin dashboard
    app.get("/users/admin",  async (req, res) => {
      try {
        const email = req.query.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let admin = false;
        if (user) {
          admin = user?.rol === "admin";
        }
        res.send({ admin });
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    // trainer dashboard
    app.get("/users/trainer",  async (req, res) => {
      try {
        const email = req.query.email;
        const query = { email: email };
        const user = await tarinerConfrimCollection.findOne(query);
        let admin = false;
        if (user) {
          admin = user?.status === "trainer";
        }
        res.send({ admin });
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.put("/users", async (req, res) => {
      try {
      const id = req.query.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          rol: "admin"
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: "user alredy exists", insertedId: null });
        }

        const result = await userCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    // ---------------------------------User api end--------------------------------------------
    // -------------------------------Subscribers api start--------------------------------------------
    
    // admin dashboard
    app.get("/subscribers", async (req, res) => {
      try {
        const result = await subscribersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    // user dashboard
    app.post("/subscribers", async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await subscribersCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: "user alredy exists", insertedId: null });
        }

        const result = await subscribersCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    // ---------------------------------Subscribers api end--------------------------------------------
      
    // -------------------------------Tariners api start--------------------------------------------
    app.get("/tariners", async (req, res) => {
      try { 
        const result = await tarinersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.put("/tariners/:id", async (req, res) => {
      try {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          status:"trainer"
        }
      }
      const result = await tarinersCollection.updateOne(filter, updatedDoc)
      res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.post("/tariners", async (req, res) => {
      try {
        const result = await tarinersCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.delete("/confrimTariners", async (req, res) => {
      try {
        const id = req.query.id;
        const filter = {_id: new ObjectId(id)}
        const result = await tarinersCollection.deleteOne(filter);
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    // ---------------------------------Tariners api end--------------------------------------------
    app.get("/tarinerApply/:id", async (req, res) => {
        try{
        const filter = {_id: new ObjectId(req.params.id)}
        const result = await tarinerConfrimCollection.findOne(filter);
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/confrimTariners", async (req, res) => {
      try {
        const result = await tarinerConfrimCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.post("/confrimTariners", async (req, res) => {
      try {
        const result = await tarinerConfrimCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
     // ---------------------------------tariners dashrord api end--------------------------------------------
     app.get("/class", async (req, res) => {
      try {
        const result = await classCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
     app.get("/tarinerApply/class/:email", async (req, res) => {
      try {
        const filter = {tranier_email: req.params.email}
        const result = await classCollection.find(filter).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
     app.get("/class/:id", async (req, res) => {
      try {
        const filter = {_id: new ObjectId(req.params.id)}
        const result = await classCollection.findOne(filter);
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.get('/featured/class', async (req, res) => {
      const result = await classCollection.find().sort({ _id: 1 }).limit(6).toArray()
      res.send(result)
  })
  app.patch('/updateApplicants/:id', async (req, res) => {
    const { id } = req.params;
    const query = { _id: new ObjectId(id) }
    const job = await classCollection.findOne(query);

    if (job) {
        const result = await classCollection.updateOne(query, {
            $inc: { applicants_number: 1 },
        });
        res.send(result);
    }
});
     app.post("/class", async (req, res) => {
      try {
        const result = await classCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
     // ---------------------------------gallery api end--------------------------------------------
    app.get('/userBooking/class/list', async(req, res)=>{
      const filter = {user_email: req.query.email}
      const result = await memborCollection.find(filter).toArray()
      res.send(result)
    })
    app.get('/userBooking/member/list', async(req, res)=>{
      const filter = {tranier_email: req.query.email}
      const result = await memborCollection.find(filter).toArray()
      res.send(result)
    })
    app.get('/userBooking', async(req, res)=>{
      const result = await memborCollection.find().toArray()
      res.send(result)
    })
    app.post('/userBooking/class', async(req, res)=>{
      const result = await memborCollection.insertOne(req.body)
      res.send(result)
    })
    // ---------------------------------gallery api end--------------------------------------------
    app.get("/membor/payment", async (req, res) => {
      try {
        const email = req.query.email;
        const query = { email: email };
        const resutl = await memborCollection.find(query).toArray();
        res.send(resutl);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.get("/payment",  async (req, res) => {
      try {
        const email = req.query?.email;
        const query = {email: email}
        const resutl = await paymentCollection.find(query).toArray();
        res.send(resutl);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { price } = req.body;
        const amount = parseInt(price * 100);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.send({
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.get("/payment/data/history", async (req, res) => {
      const filter = {user_email: req.query.email}
      const resutl = await paymentCollection.find(filter).toArray();
      res.send(resutl)
    });
    // admin
    app.get("/payment/data", async (req, res) => {
      const resutl = await paymentCollection.find().toArray();
      res.send(resutl)
    });
    app.post("/payment/data", async (req, res) => {
      const payment = req.body;
      const resutl = await paymentCollection.insertOne(payment);
      res.send(resutl)
    });
    
     app.get("/gallery", async (req, res) => {
      try {
        const { offset = 0, limit = 12 } = req.query;
        const result = await galleryCollection
          .find()
          .skip(parseInt(offset))
          .limit(parseInt(limit))
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    // await client.db("admin").command({ ping: 1 });
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
