require('dotenv').config();

const express = require('express')
const app = express()

//data parsing
app.use(express.json())

const port = process.env.PORT|| '8080';
const multer = require('multer');

const cors = require('cors')
app.use(cors());

var storage = multer.diskStorage({
    destination: function (req, file,cb) {
      cb(null, './uploads/')
    },
    filename : function(req,file,cb){
        cb(null,file.originalname)
    }
});

const upload = multer({storage:storage})

//mongodb
const mongodb = require('mongodb')
const mongoClient = mongodb.MongoClient;
const objectId = mongodb.ObjectID

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017'


app.get("/",(req,res)=>
{
  res.send("welcome to my app!!!")
})


//register route
app.post('/user/register', upload.single("profilepic"), (async (req, res) => {
    const client = await mongoClient.connect(dbUrl);
    if (client) {
        try {

            let { fullname, mobile, jobtype, email, dob } = req.body;
            let profilepic= req.file.originalname;
            console.log(profilepic);

            //validation 

            if (!fullname || !mobile || !jobtype || !profilepic || !email || !dob)
                return res.send({ message: "Please enter all required fields." });

            let db = client.db('registerForm');

            let userFound = await db.collection('users').findOne({ "email": email });
            console.log(userFound)

            if (userFound) {
                return res.send({
                    message: "An account with this email already exists, kindly login!!",
                })
            }

            else {


                // Insert  new user data to db
                req.body.profilepic=profilepic;
                const user = await db.collection('users').insertOne(req.body);

                if (user) {

                    res.send({ message: ' Registered successfully.' });

                }
            }
            client.close();
        } catch (error) {
            console.log(error);
            client.close();
        }
    }

}));


//getUsers route

app.get('/users' ,async (req,res)=>
{
   const client = await mongoClient.connect(dbUrl)
   if(client){
       try{
        const db = client.db('registerForm');
        const users =  await db.collection('users').find().toArray();
        if(users)
        {
          res.send(users);
          console.log(`users : ${users}`);
        }
 
        client.close();
       
       }catch(error)
       {
           console.log(error)
           res.send({message : "Error occured while fetching users."});
           client.close();
       }
   }
 
});


//updating user route
app.put('/user/update/:id' ,async (req,res)=>
{
   const client = await mongoClient.connect(dbUrl)
   if(client){
       try{
         const {id} = req.params;
         console.log(id)
         const db = client.db('registerForm');
         let updateUser = await db.collection('users').updateOne({"_id":objectId(id)} ,{$set:{"fullname":req.body.updatedUser.fullname,
         "mobile":req.body.updatedUser.mobile,"jobtype":req.body.updatedUser.jobtype,"preflocation":req.body.updatedUser.preflocation,
       "email":req.body.updatedUser.email,"dob":req.body.updatedUser.dob}});
         console.log(updateUser)
         if(updateUser)
         {
            const users =  await db.collection('users').find().toArray();
            res.send(users);
           console.log(`Updated todos : ${updateUser}`);
         }
      
  
       client.close();
       }catch(error)
       {
           console.log(error)
           res.send({message : "Error occured while updating user."});
           client.close();
       }
   }
 
});

//deleting user route
app.delete('/user/delete/:id' ,async (req,res)=>
{
   const client = await mongoClient.connect(dbUrl)
   if(client){
       try{
        const {id} = req.params;
        const db = client.db('registerForm');
        let deleteUser = await db.collection('users').deleteOne({"_id":objectId(id)});
        if(deleteUser)
        {
            const users =  await db.collection('users').find().toArray();
          res.send(users);
          console.log("user deleted successfully ");
        }
       client.close();
       }catch(error)
       {
           console.log(error)
           res.send({message : "error occured while deleting user "});
           client.close();
       }
   }
 
});


// setting up of port

    app.listen(port,()=>
    {
        console.log(`Connection is established and app started running on port : ${port}!!!`)
  
    })



