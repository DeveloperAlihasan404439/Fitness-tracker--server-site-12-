const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.port || 5000;
require("dotenv").config();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
// app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

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

    // -------------------------------jwt api start--------------------------------------------
    app.post("/jwt", async (req, res) => {
      try {
        const user = req.body;
        const token = jwt.sign(user, process.env.JWT_TOKEN, {
          expiresIn: "1h",
        });
        res
          .cookie("token", token, {
            httpOnly: true,
            secure: false,
          })
          .send({ message: "success" });
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    app.post("/logout", async (req, res) => {
      try {
        const user = req.body;
        res.clearCookie("token", { maxAge: 0 }).send({ message: "success" });
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
    // -------------------------------jwt api end--------------------------------------------
    // -------------------------------varifyed api start--------------------------------------------
    const varifyed = async (req, res, next) => {
      try {
        const token = req.cookies?.token;
        if (!token) {
          return res.status(401).send("unauthorizs token");
        }
        jwt.verify(token, process.env.JWT_TOKEN, (err, decode) => {
          if (err) {
            return res.status(401).send("unauthorizs token");
          }
          req.decode = decode;
          next();
        });
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    };
    const varifyAdmin = async (req, res, next) => {
      const email = req.decode?.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.rol === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbident access" });
      }
      next();
    };
    const varifyTrainer = async (req, res, next) => {
      const email = req.decode?.email;
      const query = { email: email };
      const user = await tarinerConfrimCollection.findOne(query);
      const isAdmin = user?.status === "trainer";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbident access" });
      }
      next();
    };
    // -------------------------------varifyed api start--------------------------------------------
   
    // -------------------------------User api start--------------------------------------------
    // admin dashboard
    app.get("/users",varifyed, async (req, res) => {
      try {
        if (req.query?.email !== req.decode?.email) {
          return res.status(403).send("unauthorizes token");
        }
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
    app.get("/users/admin", varifyed,varifyAdmin, async (req, res) => {
      try {
        const email = req.query.email;
        if (email !== req?.decode?.email) {
          return res.status(401).send({ message: "unauthorize access" });
        }
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
    app.get("/users/trainer", varifyed,varifyTrainer, async (req, res) => {
      try {
        const email = req.query.email;
        if (email !== req?.decode?.email) {
          return res.status(401).send({ message: "unauthorize access" });
        }
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
    app.put("/users",varifyed,varifyAdmin, async (req, res) => {
      try {
      const id = req.query.id;
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          rol: "admin"
        }
      }
      console.log(filter, updatedDoc)
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
    app.get("/subscribers", varifyed,varifyAdmin, async (req, res) => {
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
    app.get("/confrimTariners/:id",varifyed, async (req, res) => {
      try { 
        const id = req.params.id;
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
    app.post("/confrimTariners",varifyed,varifyAdmin, async (req, res) => {
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
        /* const email = req.query.email;
        if (email !== req?.decode?.email) {
          return res.status(401).send({ message: "unauthorize access" });
        } */
        const result = await classCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
      }
    });
     app.get("/class/:id", async (req, res) => {
      try {
        const email = req.query.email;
        /* if (email !== req?.decode?.email) {
          return res.status(401).send({ message: "unauthorize access" });
        } */
        const filter = {_id: new ObjectId(req.params.id)}
        const result = await classCollection.findOne(filter);
        res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error");
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
