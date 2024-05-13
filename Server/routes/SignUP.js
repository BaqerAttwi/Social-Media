import express from 'express';
import multer from 'multer';
import mysql from 'mysql';
import axios from 'axios';

const router = express.Router();

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "socailweb"
});

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/images/Avtar'); // Destination folder for storing images
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]); // Unique filename
    }
});

// Define '/users' route
router.get('/users', (req, res) => {
    res.send({ data: "Here is your data" });
});
const upload = multer({ storage: storage });

router.post('/signinfoupload', upload.single('image'), async (req, res) => {
    try {
        console.log("HI");
        console.log(req.body.email + " " +
            req.body.password + " " +
            req.body.username + " " +
            req.body.date_of_birth + " " +
            req.body.gender + " " +
            req.body.nationality);

        // Check if email is valid
        if (!isValidEmail(req.body.email)) {
            return res.status(400).json({ error: "Invalid email address" });
        }

        // Check if email already exists in the database
        const emailExists = await checkEmailExistence(req.body.email);
        if (emailExists) {
            return res.status(400).json({ error: "Email already exists. Please use a different one." });
        }

        // Check if nationality exists
        const nationalityExists = await checkNationalityExistence(req.body.nationality);
        if (!nationalityExists) {
            return res.status(400).json({ error: "Nationality does not exist. Please enter a valid one." });
        }

        // Check if gender is valid
        if (req.body.gender !== "male" && req.body.gender !== "female") {
            return res.status(400).json({ error: "Invalid gender. Please specify 'male' or 'female'." });
        }

        // Check if username exists in the database
        const usernameExists = await checkUsernameExistence(req.body.username);
        if (usernameExists) {
            return res.status(400).json({ error: "Username already exists. Please choose a different one." });
        }

        // Insert data into the database
        const q = "INSERT INTO Usersinfo(username,email,password,dateofbirth, profileurl, gender, nationality) VALUES (?, ?, ?, ?, ?, ?, ?)";
        const values = [
            req.body.username,
            req.body.email,
            req.body.password,
            req.body.date_of_birth,
            req.file.filename, // Image filename
            req.body.gender,
            req.body.nationality,
           
        ];
        db.query(q, values, (err, data) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error inserting data into the database" });
            }
            console.log("Data inserted successfully");
            return res.status(200).json({ message: "Data inserted successfully" });
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

const isValidEmail = (email) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
};

const checkEmailExistence = async (email) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT COUNT(*) AS count FROM users WHERE email = ?";
        db.query(query, [email], (err, result) => {
            if (err) {
                console.error('Error checking email existence:', err);
                reject(err);
            } else {
                resolve(result[0].count > 0);
            }
        });
    });
};

const checkNationalityExistence = async (nationality) => {
    try {
        const response = await axios.get(`https://restcountries.com/v3.1/name/${nationality}`);
        return response.data.length > 0;
    } catch (error) {
        console.error('Error checking nationality existence:', error);
        throw error;
    }
};

const checkUsernameExistence = async (username) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT COUNT(*) AS count FROM users WHERE username = ?";
        db.query(query, [username], (err, result) => {
            if (err) {
                console.error('Error checking username existence:', err);
                reject(err);
            } else {
                resolve(result[0].count > 0);
            }
        });
    });
};
export default router;