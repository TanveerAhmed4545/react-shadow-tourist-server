const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dc9spgo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const userCollection = client.db("shadowDb").collection("Users");
    const packageCollection = client.db("shadowDb").collection("packages");


    // user related api 
    app.get('/users',async(req,res)=>{
        const result = await userCollection.find().toArray();
        res.send(result);
    })

    // get a user info by email from db
    app.get('/user-role/:email',async(req,res)=>{
        const email = req.params.email
        const result = await userCollection.findOne({email});
        res.send(result)
      })

    app.post('/users',async (req,res)=>{
        const user = req.body;
        // insert email if user does not exists
  
        const query = {email: user.email}
        const existingUser = await userCollection.findOne(query)
        if(existingUser){
          return res.send({message: 'user already exists', insertedId: null})
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
      })

      //update a user role
        app.patch('/users/update/:email', async (req, res) => {
        const email = req.params.email
        const user = req.body
        const query = { email }
        const updateDoc = {
          $set: { ...user },
        }
        const result = await userCollection.updateOne(query, updateDoc)
        res.send(result)
      })

      
       // save a user data in db
       app.put('/user',async (req,res)=>{
        const user = req.body;
        const query = {email: user?.email}

        // check if user already exists in db
  
        const isExist = await userCollection.findOne(query)
        if(isExist){
          if(user.status === 'Requested'){
           const result = await userCollection.updateOne(query,{$set: {status: user?.status}})
           return res.send(result);
          }else{
            return res.send(isExist)
          }
        }

        const options = {upsert: true}     
        
        const updateDoc ={
          $set: {
            ...user
          }
        }
        const result = await userCollection.updateOne(query,updateDoc,options)
        res.send(result);
      })
  


    //   packages

    app.get('/package',async(req,res)=>{
        const result = await packageCollection.find().toArray();
        res.send(result);
    })

    app.post('/package',async(req,res)=>{
        const item = req.body;
        const result = await packageCollection.insertOne(item);
        res.send(result);
      })






    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/',(req,res)=>{
    res.send('shadow is running')
})

app.listen(port,()=>{
    console.log(`Shadow Tourist is Running on port ${port}`);
})

