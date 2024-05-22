import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import axios from 'axios';
import signupRoutes from "./routes/SignUP.js"; // Rename import for clarity
import Login from "./routes/Login.js";
import verifyToken from './routes/Middleware.js';
import post from './routes/post.js';
const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "socailweb"
});

app.use('/routes', signupRoutes); // Mount the router under '/api' base path

app.use('/routes', Login); // Mount the router under '/api' base path
app.get("/", (req, res) => {
    res.json("hello this is backend")
});

app.use('/routes', verifyToken, post);

app.listen(8800, () => {
    console.log("Server is running on port 8800");
});
