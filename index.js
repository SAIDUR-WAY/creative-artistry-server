const express = require('express');
const app = express();
var jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
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
   //    await client.connect();

     const classesCollection = client.db('artCraftDb').collection('classes')
     const instractorsCollection = client.db('artCraftDb').collection('instractors')
     const myClassesCollection = client.db('artCraftDb').collection('myclasses')
     const usersCollection = client.db('artCraftDb').collection('users')
     const paymentCollection = client.db('artCraftDb').collection('payment')


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
          const query ={email: email};
          // if(req.decoded.email !== email){
          //      res.send({ admin: false })
          // }
          
          const user = await usersCollection.findOne(query);
         
          if(user?.role === 'admin'){
               const result = { admin: "admin"}
              return res.send(result)
          }
          if(user?.role === 'instructor'){
               const result = { admin: "instructor"}
              return res.send(result)
          }
          if(user?.role === 'student'){
               const result = { admin: "student"}
              return res.send(result)
          }
          
          
          

     })

 app.patch('/users/manage', async(req, res)=>{
     const email = req.query.email;
     // console.log(email)
     const role = req.query.role;
     // console.log(role);
     const filter ={email: email}
     const updateDoc = {
          $set: {
               role: role
          }
     }
     const result = await usersCollection.updateOne(filter, updateDoc);
     res.send(result)
 })
 app.get('/users/allinstructor', async (req, res)=>{
     const result = await usersCollection.find({ role: 'instructor' }).toArray();
     res.send(result);
 })
 app.delete('/users/:id', async(req, res)=>{
     const id = req.params.id;
     const query = {_id: new ObjectId(id)};
     const result = await usersCollection.deleteOne(query);
     res.send(result)
 })

 app.get('/users-with-classes', async (req, res) => {
     try {
       const allUsers = await usersCollection.find({ role: 'instructor' }).toArray();
       const userEmails = allUsers.map((user) => user.email);
   
       const usersWithClasses = await classesCollection
         .find({ instructorEmail: { $in: userEmails } })
         .toArray();
   
       const usersClassesArray = usersWithClasses.map((userClass) => {
         const user = allUsers.find((user) => user.email === userClass.instructorEmail);
         return {
           user: user,
           class: userClass
         };
       });
   
       res.send(usersClassesArray);
     } catch (error) {
       console.error(error);
       res.status(500).send("Error retrieving users with classes");
     }
   });
   
   
   
//  app.get('/popularins', async (req, res) => {
//      const email = req.query.email;
//      const query = { email: email };
//      const selectedUsers = await usersCollection.find(query).toArray();

//      const queryClass = { instructorEmail: email };
//      const selectClasses = await classesCollection.find(queryClass).toArray();
   
//      const combinedResults = [...selectedUsers, ...selectClasses];
   
//      res.send(combinedResults);
//    });

     // instructor collection not use but future in use;
     // app.get('/instructors', async (req, res)=>{
     //      const result = await usersCollection.find({ role: 'instructor' }).toArray();
     //      res.send(result)
     // })

   // use for admin manage classes for all data
   app.get('/classes/manage', async (req, res)=>{
     const result = await classesCollection.find().toArray();
     res.send(result);
   })

   app.patch('/classes/manage/:id', async (req, res)=>{
     const id = req.params.id;
     const  value = req.body;

     const filter = {_id: new ObjectId(id)}
     const updateDoc = {
          $set: 
           value
          
     }
   

     const result = await classesCollection.updateOne(filter, updateDoc)
     res.send(result);

   })

     // use for instrucor dashbord myclasses
     app.get('/classes', async(req, res)=>{
          const email = req.query.email;
          const query = {instructorEmail: email};
          const result = await classesCollection.find(query).toArray();
          res.send(result)
     })
     // use for instructor update button
     app.get('/classes/update/:id', async(req, res)=>{
          const id = req.params.id;
          const query = {_id: new ObjectId(id)}
          const result = await classesCollection.findOne(query)
          res.send(result)
     })
    

     app.get('/classes/approvedclasses', async (req, res)=>{
       const result = await classesCollection.find({ status: 'approved' }).toArray();
       res.send(result)



     })
     app.get('/classes/popularclasses', async (req, res) => {
          const result = await classesCollection.find({ status: 'approved' }).sort({ enrolledStudent: -1 }).toArray();
          res.send(result);
        });

     //instructor update data from update.jsx
     app.patch('/classes/:id', async (req, res)=>{
          const id = req.params.id;
          
          const updatedClass = req.body;
          const filter = {_id: new ObjectId(id)};
          const updateDoc = {
               $set: 
                    updatedClass
               
          }
          const result = await classesCollection.updateOne(filter, updateDoc);
          res.send(result)
     })




     // insert data in instrutor add class
     app.post('/classes', async(req, res)=>{
          const data = req.body;
          // console.log(data)
          const result = await classesCollection.insertOne(data);
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
          const query = {studentEmail: email};
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
     //student single class get
     app.get('/myclasses/payment/:id', async(req,res)=>{
          const id= req.params.id;
          const query = {_id: new ObjectId(id)};
          const result = await myClassesCollection.findOne(query);
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
     //create payment intent
     app.post('/create-payment-intent', async(req, res)=>{
          const price = req.body.paymentPrice;
          const amount  = parseInt(price * 100);

          const paymentIntent = await stripe.paymentIntents.create({
               amount: amount,
               currency: 'usd',
               payment_method_types: ['card'],
               description: 'payment'
          });
          res.send({
               clientSecret: paymentIntent.client_secret
          })
     })


     //pament api
     app.get('/payment', async(req,res)=>{
          const email = req.query.email;
          const query = {email: email};
          const result = await paymentCollection.find(query).toArray();
          result.sort((a, b) => new Date(b.date) - new Date(a.date));
          res.send(result)
     })
     // app.get('/payment/allpayment', async (req, res)=>{
     //      const result = await paymentCollection.find().toArray();
     //      res.send(result)
     // })
     app.post('/payment', async(req, res)=>{
          const payment = req.body;
          const result = await paymentCollection.insertOne(payment);

          const myClassAddId = payment.myClassAddId;
          const query = {_id: new ObjectId(myClassAddId)}
          const deleteAddClass= await myClassesCollection.deleteOne(query);


          const classId = payment.classId;
          const filter = {_id: new ObjectId(classId)}
          const updateDoc = {
               $set: {
                    availibleSeats: payment.availibleSeats,
                    enrolledStudent: payment.enrolledStudent

               }
          }
          const updateSeats = await classesCollection.updateOne(filter, updateDoc);

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