const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://BookCourierDB:1gtC86UhG5hhOvUP@bookcourierdb.qizpvyi.mongodb.net/?appName=BookCourierDb";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});
async function run() {
  const db = client.db("BookCourierDB");
  const usersCollection = db.collection("users");
  const booksCollection = db.collection("books");
  const coverageCollection = db.collection("coverage");
  try {
    await client.connect();

    app.post("/users", async (req, res) => {
      const user = req.body;

      const existingUser = await usersCollection.findOne({ email: user.email });

      if (existingUser) {
        return res.status(409).send({ message: "Email already registered" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    app.get("/allusers", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedUser = req.body;
      console.log(updatedUser);
      const options = { upsert: true };
      const user = {
        $set: {
          librarian: updatedUser.librarian,
          admin: updatedUser.admin,
        },
      };
      const result = await usersCollection.updateOne(filter, user, options);
      res.send(result);
    });

    app.post("/books", async (req, res) => {
      const book = req.body;

      res.send(book);
      const result = await booksCollection.insertOne(book);
      res.send(result);
    });

    app.get("/books", async (req, res) => {
      const query = req.query;
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/allbooks", async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
    });
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    app.put("/books/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBook = req.body;
      console.log(updatedBook);
      const options = { upsert: true };
      const book = {
        $set: {
          author: updatedBook.author,
          name: updatedBook.name,
          image: updatedBook.image,
          price: updatedBook.price,
          status: updatedBook.status,
          addedAt: updatedBook.addedAt,
          description: updatedBook.description,
        },
      };
      const result = await booksCollection.updateOne(filter, book, options);
      res.send(result);
    });
    app.patch("/books-admin/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      const result = await booksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );

      res.send(result);
    });
    app.get("/latest-books", async (req, res) => {
      const result = await booksCollection
        .find()
        .sort({ addedAt: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });
  app.post("/coverage", async (req, res) => {
  try {
    const { district, coveredArea, latitude, longitude } = req.body;

    const filter = { district: district.trim() };

    const updateDoc = {
      $push: {
        coverage: {
          coveredArea: coveredArea.trim(),
          latitude,
          longitude
        }
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    };

    const options = { upsert: true };

    const result = await coverageCollection.updateOne(
      filter,
      updateDoc,
      options
    );

    res.status(201).send({
      success: true,
      message: result.upsertedId
        ? "New district created & area added"
        : "Area added to existing district"
    });
    

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error" });
  }
});
    app.get("/coverage", async (req, res) => {
      try {
        const areas = await coverageCollection.find().toArray();
        res.status(200).send(areas);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });
    await client.db("admin").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
