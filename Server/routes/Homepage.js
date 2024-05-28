// posts.js
import multer from 'multer';
import express from 'express';
import mysql from 'mysql';
import verifyToken from './Middleware.js';
const router = express.Router();
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
  router.get('/getallpostsF', verifyToken, (req, res) => {
    const userId = req.userId;
    const checkFriendshipQuery = `
        SELECT *
        FROM friends
        WHERE (friendReq = ? OR friendRes = ?) AND status = 'accepted'
    `;
    db.query(checkFriendshipQuery, [userId, userId], (err, friendshipResults) => {
        if (err) {
            console.error('Error checking friendship: ' + err.stack);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (friendshipResults.length === 0) {
            // User is not friends with anyone or no accepted friendships found
            return res.status(403).json({ error: 'You are not friends with anyone.' });
        }
        const sql = `
            SELECT post.*, 
                users.username, 
                users.profileurl, 
                (SELECT COUNT(*) FROM likes WHERE post.id = likes.postlikes) AS likes, 
                (SELECT COUNT(*) FROM comments WHERE post.id = comments.post_id) AS comments
            FROM post
            JOIN users ON post.user_id = users.id
            WHERE post.user_id IN (
                SELECT CASE
                    WHEN friendReq = ? THEN friendRes
                    ELSE friendReq
                END AS friend_id
                FROM friends
                WHERE (friendReq = ? OR friendRes = ?) AND status = 'accepted'
            )
            GROUP BY post.id
        `;
        db.query(sql, [userId, userId, userId], (err, results) => {
            if (err) {
                console.error('Error fetching posts: ' + err.stack);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json(results);
        });
    });
});


  router.get('/getusernameF/:id', verifyToken, (req, res) => {
    const userId = req.params.id;
    const sql = 'SELECT username,profileurl FROM users WHERE id = ?';
    db.query(sql, [userId], (err, result) => {
      if (err) {
        console.error('Error fetching username: ' + err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json(result[0]);
    });
  });
  router.get('/searchusersF', verifyToken, (req, res) => {
    const userId = req.userId;
    const query = req.query.query;
  
    const sql = `
      SELECT id, username, profileurl 
      FROM users 
      WHERE username LIKE ? 
      AND id != ? 
      AND id IN (
        SELECT CASE 
          WHEN friendReq = ? THEN friendRes 
          ELSE friendReq 
        END AS friendId
        FROM friends
        WHERE (friendReq = ? OR friendRes = ?) AND status = 'accepted'
      )
    `;
    const values = [`%${query}%`, userId, userId, userId, userId];
  
    db.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error searching users: ' + err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json(results);
    });
  });
  const getFriendStatusF = async (req, res) => {
    const userId = req.userId;
    const friendId = req.params.friendId;
  
    const sql = `
      SELECT status 
      FROM friends 
      WHERE (friendReq = ? AND friendRes = ?) 
      OR (friendReq = ? AND friendRes = ?)
    `;
  
    try {
      const [result] = await new Promise((resolve, reject) => {
        db.query(sql, [userId, friendId, friendId, userId], (err, result) => {
          if (err) {
            console.error('Error fetching friend status:', err);
            reject(err);
          }
          resolve(result);
        });
      });
  
      if (result) {
        res.json({ status: result.status });
      } else {
        res.status(404).json({ message: 'No friend request found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error fetching friend status' });
    }
  };
  
  export default router;