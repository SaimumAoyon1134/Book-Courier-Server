const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://BookCourierDB:1gtC86UhG5hhOvUP@bookcourierdb.qizpvyi.mongodb.net/?appName=BookCourierDb";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(cors())

app.get('/', (req, res) => {
  res.send('Hello World!')
})
async function run() {
  const db = client.db("BookCourierDB");
  const booksCollection = db.collection("books");
  try {
    
    await client.connect();
    app.post('/books', async (req, res) => {
      const book = req.body;
      console.log(book);
      res.send(book);
      const result = await booksCollection.insertOne(book);
      res.send(result);
      
    });

    app.get('/books', async (req, res) => {
      const query = req.query;
      console.log(query);
      const result = await booksCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/books/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    app.put('/books/:id', async (req, res) => {
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
          description: updatedBook.description,
        },
      };
      const result = await booksCollection.updateOne(filter, book, options);
      res.send(result);
    });


    await client.db("admin").command({ ping: 1 });




    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})