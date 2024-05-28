import express from 'express';
import multer from 'multer';
import mysql from 'mysql';
import axios from 'axios';
import bcrypt, { hash } from 'bcrypt';
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const saltRounds=10;
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "socailweb"
});

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../../Social-Media/frontend/public/Images/Profile'); // Destination folder for storing images
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

// router.post('/signinfoupload', upload.single('image'), async (req, res) => {
//     try {
//         console.log("HI");
//         console.log(req.body.email + " " +
//             req.body.password + " " +
//             req.body.username + " " +
//             req.body.date_of_birth + " " +
//             req.body.gender + " " +
//             req.body.nationality);

//         // Check if email is valid
//         if (!isValidEmail(req.body.email)) {
//             return res.status(400).json({ error: "Invalid email address" });
//         }

//         // Check if email already exists in the database
//         const emailExists = await checkEmailExistence(req.body.email);
//         if (emailExists) {
//             return res.status(400).json({ error: "Email already exists. Please use a different one." });
//         }

//         // Check if nationality exists
//         const nationalityExists = await checkNationalityExistence(req.body.nationality);
//         if (!nationalityExists) {
//             return res.status(400).json({ error: "Nationality does not exist. Please enter a valid one." });
//         }

//         // Check if gender is valid
//         if (req.body.gender !== "male" && req.body.gender !== "female") {
//             return res.status(400).json({ error: "Invalid gender. Please specify 'male' or 'female'." });
//         }

//         // Check if username exists in the database
//         const usernameExists = await checkUsernameExistence(req.body.username);
//         if (usernameExists) {
//             return res.status(400).json({ error: "Username already exists. Please choose a different one." });
//         }
//         const password=req.body.password;
//           bcrypt.hash(password,saltRounds,(err,hash)=>{
//             if (err){console.log(err);}
//             const q = "INSERT INTO Usersinfo(username,email,password,dateofbirth, profileurl, gender, nationality) VALUES (?, ?, ?, ?, ?, ?, ?)";
//         const values = [
//             req.body.username,
//             req.body.email,
//             hash,
//             req.body.date_of_birth,
//             req.file.filename, // Image filename
//             req.body.gender,
//             req.body.nationality,
           
//         ];
//         console.log(req.body.email + " " +
//     hash + " " +
//         req.body.username + " " +
//         req.body.date_of_birth + " " +
//         req.body.gender + " " +
//         req.body.nationality);
//          // Insert data into the database
//          db.query(q, values, (err, data) => {
//             if (err) {
//                 console.error(err);
//                 return res.status(500).json({ error: "Error inserting data into the database" });
//             }
//             console.log("Data inserted successfully");
//             return res.status(200).json({ message: "Data inserted successfully" });
//         });
//           });
       
//     } catch (error) {
//         console.error('Error processing request:', error);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// });
router.post('/signinfoupload', upload.single('image'), async (req, res) => {
    try {
        console.log("Received POST request at /signinfoupload");
        console.log("Request Body: ", req.body);
        console.log("Uploaded File: ", req.file);

        // Validate email
        if (!isValidEmail(req.body.email)) {
            console.log("Invalid email address");
            return res.status(400).json({ error: "Invalid email address" });
        }
        
        // Check email existence
        const emailExists = await checkEmailExistence(req.body.email);
        if (emailExists) {
            console.log("Email already exists");
            return res.status(400).json({ error: "Email already exists. Please use a different one." });
        }

        // Validate nationality
        // const nationalityExists = await checkNationalityExistence(req.body.nationality);
        // if (!nationalityExists) {
        //     console.log("Invalid nationality");
        //     return res.status(400).json({ error: "Nationality does not exist. Please enter a valid one." });
        // }

        // Validate gender
        if (req.body.gender !== "male" && req.body.gender !== "female") {
            console.log("Invalid gender");
            return res.status(400).json({ error: "Invalid gender. Please specify 'male' or 'female'." });
        }

        // Check username existence
        const usernameExists = await checkUsernameExistence(req.body.username);
        if (usernameExists) {
            console.log("Username already exists");
            return res.status(400).json({ error: "Username already exists. Please choose a different one." });
        }

        // Hash password
        const password = req.body.password;
        console.log("Hashing password");
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).json({ error: "Error hashing password" });
            }
            console.log("Password hashed successfully");
            const fname="Profile.png";
            const query = "INSERT INTO users(username,email,password,dateofbirth, profileurl, gender, nationality) VALUES (?, ?, ?, ?, ?, ?, ?)";
            const values = [
                req.body.username,
                req.body.email,
                hash,
                req.body.date_of_birth,
                fname,
                req.body.gender,
                req.body.nationality,
            ];
            console.log("Inserting data into the database");
            db.query(query, values, (err, data) => {
                if (err) {
                    console.error("Error inserting data into the database:", err);
                    return res.status(500).json({ error: "Error inserting data into the database" });
                }
    
                console.log("Data inserted successfully");
                return res.status(200).json({ message: "Data inserted successfully" });
            });
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
        const query = "SELECT * FROM users WHERE email = ?";
        db.query(query, [email], (err, result) => {
            if (err) {
                console.error('Error checking email existence:', err);
                reject(err);
            } else {
                resolve(result.length > 0); // Adjusted here
            }
        });
    });
};

const checkNationalityExistence = async (nationality) => {
    try {
        const response = await axios.get(`https://restcountries.com/v3.1/name/${nationality}`,{timeout: 5000 });
        return response.data.length > 0;
    } catch (error) {
        console.error('Error checking nationality existence:', error);
        throw error;
    }
};

const checkUsernameExistence = async (username) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT COUNT(*) AS count FROM users  WHERE username = ?";
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
router.get('/', (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Extract JWT token from Authorization header
    const decodedToken = jwt.decode(token);
    const user_id = decodedToken.userId;
  
    const sql = 'SELECT * FROM post WHERE user_id = ?';
    db.query(sql, [user_id], (err, results) => {
        if (err) {
            console.error('Error fetching posts: ' + err.stack);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
  });
  router.get('/check-username', (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const query = 'SELECT COUNT(*) AS count FROM users WHERE username = ?';
    db.query(query, [username], (err, result) => {
        if (err) {
            console.error('Error checking username existence:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const exists = result[0].count > 0;
        return res.json({ exists });
    });
});
router.get('/check-email', (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const query = 'SELECT COUNT(*) AS count FROM users WHERE email = ?';
    db.query(query, [email], (err, result) => {
        if (err) {
            console.error('Error checking email existence:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const exists = result[0].count > 0;
        return res.json({ exists });
    });
});

export default router;