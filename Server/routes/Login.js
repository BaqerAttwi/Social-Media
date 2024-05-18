import express from 'express';
import multer from 'multer';
import mysql from 'mysql';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const router = express.Router();
const saltRounds = 10;

router.use(cors({
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST"],
  credentials: true
}));

router.use(express.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
router.use(cookieParser());

// Create connection to MySQL database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "socailweb"
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected to database as id ' + db.threadId);
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/images/Avatar'); // Destination folder for storing images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]); // Unique filename
  }
});

const upload = multer({ storage: storage });

// Helper functions
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

// Endpoint to handle user login
router.post('/login', (req, res) => {
  const { emailOrUsername, password } = req.body;

  const sql = `
    SELECT * 
    FROM users  
    WHERE (username = ? OR email = ?) 
  `;

  db.query(sql, [emailOrUsername, emailOrUsername], (err, results) => {
    if (err) {
      console.error('Error querying database: ' + err.stack);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    if (results.length > 0) {
      bcrypt.compare(password, results[0].password, (error, response) => {
        if (response) {
          const userId = results[0].id;
          const token = jwt.sign({ id: userId }, 'your_secret_key', { expiresIn: '1h' });

          res.cookie('token', token, { httpOnly: true });
          return res.json({ success: true, user: results[0], token });
        } else {
          res.json({ success: false, message: 'Invalid Password' });
        }
      });
    } else {
      res.json({ success: false, message: 'Invalid UserName OR Email' });
    }
  });
});

// Middleware to verify JWT
export const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }
  
  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }
    req.userId = decoded.id;
    next();
  });
};

// Endpoint to fetch user profile
router.get('/profile', verifyToken, (req, res) => {
  const userId = req.userId;

  const sql = `
    SELECT id, username, email, dateofbirth, profileurl, gender, nationality
    FROM users
    WHERE id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error querying database: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    if (results.length > 0) {
      return res.json({ success: true, user: results[0] });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  });
});

// Endpoint to update user profile
router.post('/updateUser', verifyToken, upload.single('image'), (req, res) => {
  const userId = req.userId;
  console.log("hi");
  console.log(userId);
  const { UserName, email, Password, DateOfBirth, Gender, nationality } = req.body;
  const image = req.file ? req.file.path : null;

  const updateData = {
    username: UserName,
    email: email,
    dateofbirth: DateOfBirth,
    gender: Gender,
    nationality: nationality,
    profileurl: image
  };

  if (Password) {
    bcrypt.hash(Password, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      updateData.password = hashedPassword;
      updateUser();
    });
  } else {
    updateUser();
  }

  function updateUser() {
    const sql = `
      UPDATE users
      SET ?
      WHERE id = ?
    `;
  
    db.query(sql, [updateData, userId], (err, results) => {
      if (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json({ success: true, message: 'User updated successfully' });
    });
  }
});

export default router;
