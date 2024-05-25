import multer from 'multer';
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
  // Fetch comments for a specific post
router.get('/getcomments/:postId', verifyToken, (req, res) => {
    const postId = req.params.postId;
    const sql = 'SELECT c.*, u.username FROM comments c JOIN users u ON c.Commentuser_id = u.id WHERE c.post_id = ?';
  
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
  
  // Toggle like/unlike a post
  router.post('/togglelike', verifyToken, (req, res) => {
    const { post_id } = req.body;
    const likedBy = req.userId;
  
    // Check if the user has already liked the post
    const checkLikeQuery = 'SELECT * FROM likes WHERE likedby = ? AND postlikes = ?';
    db.query(checkLikeQuery, [likedBy, post_id], (err, result) => {
      if (err) {
        console.error('Error checking like:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (result.length > 0) {
        // User has already liked the post, remove the like
        const removeLikeQuery = 'DELETE FROM likes WHERE likedby = ? AND postlikes = ?';
        db.query(removeLikeQuery, [likedBy, post_id], (err, result) => {
          if (err) {
            console.error('Error removing like:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
          res.json({ message: 'Like removed successfully' });
        });
      } else {
        // User hasn't liked the post, add the like
        const addLikeQuery = 'INSERT INTO likes (likedby, postlikes) VALUES (?, ?)';
        db.query(addLikeQuery, [likedBy, post_id], (err, result) => {
          if (err) {
            console.error('Error adding like:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
          res.json({ message: 'Like added successfully' });
        });
      }
    });
  });
  export default router;
