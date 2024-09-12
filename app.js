require('dotenv').config();
const cors = require('cors');
const userRoutes = require("./routes/userRoute.js");
const blogRoutes =  require("./routes/blogRoute.js");
const commentRoutes = require("./routes/commentRoutes.js");
const express = require('express');
const  connectDB = require("./config/db.js");
const bodyParser =require('body-parser');
const { runProducer, runConsumer } = require('./kafka'); // Import Kafka producer and consumer

// Connect Kafka producer when the server starts
runProducer().catch(console.error);

// Start the Kafka consumer
runConsumer().catch(console.error);

connectDB().catch(console.dir);
const app = express();
app.use(cors({origin: '*'})); 
app.use(bodyParser.urlencoded({
    extended:true
}))
app.use(express.json()); 

const PORT = 5000 || process.env.PORT;


app.use("/api/v/1.0/blogsite", userRoutes);
app.use("/api/v/1.0/blogsite", blogRoutes);
app.use("/api/v/1.0/blogsite",commentRoutes);

app.get('',(req, res)=> {
    res.send("hello world");
});

const server = require('http').createServer(app)
app.use((req, res, next)=>{
req.socket.on('error', () => {});
next()
});

server.listen(PORT, ()=> {
    console.log(`listening to port ${PORT}`);
})