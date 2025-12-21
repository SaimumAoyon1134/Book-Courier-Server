const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;
app.use(express.json());

require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri =process.env.URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const stripe = require("stripe")(process.env.STRIPE_SEC);
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});
async function run() {
  const db = client.db("BookCourierDB");
  const usersCollection = db.collection("users");
  const booksCollection = db.collection("books");
  const coverageCollection = db.collection("coverage");
  const ordersCollection = db.collection("orders");
  const wishlistCollection = db.collection("wishlist");
  const reviewsCollection = db.collection("reviews");

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
    app.delete("/books/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const bookId = new ObjectId(id);

    
        await ordersCollection.deleteMany({ bookId: id });

        
        await wishlistCollection.deleteMany({ bookId: id });

      
        await reviewsCollection.deleteMany({ bookId: id });

        
        const result = await booksCollection.deleteOne({ _id: bookId });

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Book not found" });
        }

        res.send({
          success: true,
          message: "Book and all related data deleted",
        });
      } catch (error) {
        console.error("Delete book error:", error);
        res.status(500).send({ message: "Server error" });
      }
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
      const query = { status: "published" };
      const result = await booksCollection
        .find(query)
        .sort({ addedAt: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });
    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
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
              longitude,
            },
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
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
            : "Area added to existing district",
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
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    });
    app.get("/orders", async (req, res) => {
      const result = await ordersCollection.find().toArray();
      res.send(result);
    });
    app.get("/myorders", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    });

    app.patch("/order/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      console.log(data);

      const query = { _id: new ObjectId(id) };
      const update = {
        $set: data,
      };
      const result = await ordersCollection.updateOne(query, update);
      res.send(result);
    });

    app.post("/create-checkout-session", async (req, res) => {
      const paymentInfo = req.body;
      const amount = parseInt(paymentInfo.price);
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "BDT",
              unit_amount: amount * 100,
              product_data: {
                name: paymentInfo.bookName,
              },
            },

            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          orderId: paymentInfo._id,
        },
        customer_email: paymentInfo.userEmail,
        success_url: `${process.env.SITE_DOMAIN}user-dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_DOMAIN}user-dashboard/cancel`,
      });

      console.log(session);
      res.send({ url: session.url });
    });

    // app.patch("/payment-success", async (req, res) => {
    //   const sessionId = req.query.session_id;
    //   const session = await stripe.checkout.sessions.retrieve(sessionId);
    //   if (session.payment_status === "paid") {
    //     const id = session.metadata.orderId;
    //     const query = { _id: new ObjectId(id) };
    //     const update = {
    //       $set: {
    //         paymentStatus:'paid',
    //       },
    //     };
    //     const result = await ordersCollection.updateOne(query,update);
    //     res.send({success:true});
    //   }
    //   res.send({ success: false });
    // });

    app.patch("/payment-success", async (req, res) => {
      try {
        const sessionId = req.query.session_id;

        if (!sessionId) {
          return res
            .status(400)
            .send({ success: false, message: "Session ID missing" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
          return res.send({ success: false, message: "Payment not completed" });
        }

        const orderId = session.metadata.orderId;

        const query = { _id: new ObjectId(orderId) };
        const update = {
          $set: {
            paymentStatus: "paid",
            paymentId: session.id,
            paidAt: new Date(),
          },
        };

        const result = await ordersCollection.updateOne(query, update);

        if (result.modifiedCount === 0) {
          return res.send({ success: false, message: "Order not updated" });
        }

        res.send({ success: true });
      } catch (error) {
        console.error("Payment success error:", error);
        res.status(500).send({ success: false, message: "Server error" });
      }
    });
    app.post("/wishlist", async (req, res) => {
      const { userEmail, bookId } = req.body;

      const exists = await wishlistCollection.findOne({ userEmail, bookId });
      if (exists) {
        return res.status(409).send({ message: "Already in wishlist" });
      }

      const result = await wishlistCollection.insertOne({
        ...req.body,
        createdAt: new Date(),
      });

      res.send(result);
    });
    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;
      const result = await wishlistCollection
        .find({ userEmail: email })
        .toArray();
      res.send(result);
    });
    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const result = await wishlistCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    app.get("/wishlist/check", async (req, res) => {
      const { email, bookId } = req.query;
      const exists = await wishlistCollection.findOne({
        userEmail: email,
        bookId,
      });
      res.send({ exists: !!exists });
    });

    app.post("/reviews", async (req, res) => {
      try {
        const { bookId, rating, review, userEmail, userName } = req.body;

        if (!bookId || !rating || !review || !userEmail) {
          return res.status(400).send({ message: "Missing required fields" });
        }

        // 1️⃣ Check delivered order
        const deliveredOrder = await ordersCollection.findOne({
          bookId,
          userEmail,
          orderStatus: "delivered",
        });

        if (!deliveredOrder) {
          return res.status(403).send({
            message: "You can review only after the book is delivered",
          });
        }

        // 2️⃣ Prevent duplicate review
        const alreadyReviewed = await reviewsCollection.findOne({
          bookId,
          userEmail,
        });

        if (alreadyReviewed) {
          return res.status(409).send({
            message: "You already reviewed this book",
          });
        }

        // 3️⃣ Save review
        const result = await reviewsCollection.insertOne({
          bookId,
          userEmail,
          userName,
          rating: Number(rating),
          review,
          createdAt: new Date(),
        });

        res.send(result);
      } catch (error) {
        console.error("Review submit error:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/reviews/:bookId", async (req, res) => {
      try {
        const bookId = req.params.bookId;

        const reviews = await reviewsCollection
          .find({ bookId })
          .sort({ createdAt: -1 })
          .toArray();

        res.send(reviews);
      } catch (error) {
        console.error("Fetch reviews error:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/reviews/average/:bookId", async (req, res) => {
      try {
        const bookId = req.params.bookId;

        const result = await reviewsCollection
          .aggregate([
            { $match: { bookId } },
            {
              $group: {
                _id: "$bookId",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
              },
            },
          ])
          .toArray();

        if (result.length === 0) {
          return res.send({
            averageRating: 0,
            totalReviews: 0,
          });
        }

        res.send(result[0]);
      } catch (error) {
        console.error("Average rating error:", error);
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
