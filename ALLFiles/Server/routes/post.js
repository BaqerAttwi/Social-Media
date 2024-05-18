// posts.js

import express from 'express';
import mysql from 'mysql';
import verifyToken from './Middleware.js';
const router = express.Router();

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

// Get all posts except those by the current user
router.get('/getallposts', verifyToken, (req, res) => {
  const userId = req.userId;
  const sql = 'SELECT * FROM post WHERE user_id != ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching posts: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});

// Get a specific post by ID
router.get('/getpost/:id', verifyToken, (req, res) => {
  const postId = req.params.id;
  const sql = 'SELECT * FROM post WHERE id = ?';
  db.query(sql, [postId], (err, result) => {
    if (err) {
      console.error('Error fetching post: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(result[0]);
  });
});

// Get comments for a specific post
router.get('/getcomments/:postId', verifyToken, (req, res) => {
  const postId = req.params.postId;
  const sql = 'SELECT c.*, u.username FROM comments c JOIN users u ON c.`Commentuser_id` = u.id WHERE c.post_id = ?';

  db.query(sql, [postId], (err, results) => {
    if (err) {
      console.error('Error fetching comments: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});

// Add a comment to a post
router.post('/addcomment', verifyToken, (req, res) => {
  const { post_id, description } = req.body;
  const Commentuser_id = req.userId;
  const date_created = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const sql = 'INSERT INTO comments (description, Commentuser_id, post_id, date_created) VALUES (?, ?, ?, ?)';
  db.query(sql, [description, Commentuser_id, post_id, date_created], (err, result) => {
    if (err) {
      console.error('Error adding comment: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json({ message: 'Comment added successfully' });
  });
});

// Get username by user_id
router.get('/getusername/:id', verifyToken, (req, res) => {
  const userId = req.params.id;
  const sql = 'SELECT username FROM users WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching username: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(result[0]);
  });
});

export default router;
