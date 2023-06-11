const express = require('express');
const app = express();
var jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//midileware
app.use(cors());
app.use(express.json());

//create jwt midileware
const verifyJWT = (req, res, next) => {
     const authorization = req.headers.authorization;
     if(!authorization){
          return res.status(401).send({error: true, message: "unauthorizes access"})
     }
     // bearer token
     const token = authorization.split(' ')[1];
     // console.log(token)
     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if(err){
               return res.stauts(401).send({error: true, message: "unable access unauthorizes"})
          }
          req.decoded = decoded;
          next()
     })
}




const uri = `mongodb+srv://${process.env.SECRET_USER}:${process.env.SECRET_PASS}@cluster0.ie2mpcl.mongodb.net/?retryWrites=true&w=majority`;

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

     const classesCollection = client.db('artCraftDb').collection('classes')
     const instractorsCollection = client.db('artCraftDb').collection('instractors')
     const myClassesCollection = client.db('artCraftDb').collection('myclasses')
     const usersCollection = client.db('artCraftDb').collection('users')


     app.post('/jwt', (req, res)=>{
          const user = req.body;
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
          res.send({token})
     })

     app.get('/users', async(req, res)=>{
          const result= await usersCollection.find().toArray();
          res.send(result)
     })
     app.post('/users', async(req, res)=>{
          const user = req.body;
          const query= {email: user.email}
          const existingUser = await usersCollection.findOne(query)
          if(existingUser){
               return res.send({message: 'User allready saved'})
          }
          
          const result = await usersCollection.insertOne(user);
          res.send(result)
     })

     app.get('/users/admin/:email', async(req, res)=>{
          const email = req.params.email;
          // console.log(email)
          const query ={email: email};
          // if(req.decoded.email !== email){
          //      res.send({ admin: false })
          // }
          const user = await usersCollection.findOne(query);
          if(user?.role === 'admin'){
               const result = { admin: "admin"}
               res.send(result)
          }
          if(user?.role === 'instructor'){
               const result = { admin: "instructor"}
               res.send(result)
          }
          // console.log(user)

     })
     // app.get('/users/instructor/:email', async(req, res)=>{
     //      const email = req.params.email;
     //      // console.log(email)
     //      const query ={email: email};
     //      // if(req.decoded.email !== email){
     //      //      res.send({ admin: false })
     //      // }
     //      const user = await usersCollection.findOne(query);
     
     //      const result = { instructor: user?.role === 'instructor'}
     //      res.send(result)
     // })

 app.patch('/users/admin/:id', async(req, res)=>{
     const id = req.params.id;
     const role = req.query.role;
     const filter ={_id: new ObjectId(id)}
     const updateDoc = {
          $set: {
               role: role
          }
     }
     const result = await usersCollection.updateOne(filter, updateDoc);
     res.send(result)
 })
 app.delete('/users/:id', async(req, res)=>{
     const id = req.params.id;
     const query = {_id: new ObjectId(id)};
     const result = await usersCollection.deleteOne(query);
     res.send(result)
 })

     app.get('/instractors', async (req, res)=>{
          const result = await instractorsCollection.find().toArray();
          res.send(result)
     })
     app.get('/classes', async (req, res)=>{
          const result = await classesCollection.find().toArray();
          res.send(result)
     })

     // myclasses collection
     app.get('/myclasses', async (req, res)=>{
          const email = req.query.email;
          // console.log(email)
          if(!email){
               res.send([])
          }

          // const decodedEmail = req.decoded.email;
          // if(email !== decodedEmail){
          //      return res.status(403).send({error: true, message: "Forbidden access"})
          // }
          const query = {email: email};
          // console.log(query);
          const result = await myClassesCollection.find(query).toArray();
          res.send(result)
     })
     app.post('/myclasses', async(req, res)=>{
          const studentClass = req.body;
          const query = {classId: studentClass.classId};
          const existingClass = await myClassesCollection.findOne(studentClass);
          
          if(existingClass){
               return res.send({message: 'This class allReady added'})
          }
          const result = await myClassesCollection.insertOne(studentClass);
          res.send(result)

     })
     app.delete('/myclasses/:id', async(req, res)=>{
          const id = req.params.id;
          // console.log(id);
          const query = {_id: new ObjectId(id)};
          // console.log(query)
          const result = await myClassesCollection.deleteOne(query);
          res.send(result)
     })
     

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
//     await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req, res)=>{
     res.send('Server Is Running!')
})

app.listen(port, ()=>{
     console.log(`Creative Server port is ${port}`)
})