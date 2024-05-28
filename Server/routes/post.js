// posts.js
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

// Get all posts except those by the current user
// Modify the /getallposts endpoint to include the number of likes
// Modify the /getallposts endpoint to include the number of likes
// Modify the /getallposts endpoint to include the number of likes and comments
router.get('/getallposts', verifyToken, (req, res) => {
  const userId = req.userId;
  const sql = `SELECT post.*, 
  users.username, 
  users.profileurl, 
  (SELECT COUNT(*) FROM likes WHERE post.id = likes.postlikes) AS likes, 
  (SELECT COUNT(*) FROM comments WHERE post.id = comments.post_id) AS comments
FROM post
JOIN users ON post.user_id = users.id
WHERE post.user_id != ?
GROUP BY post.id
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching posts: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});




// Get all posts except those by the current user
router.get('/getposts', verifyToken, (req, res) => {
  const userId = req.userId;
  const sql = 'SELECT * FROM post WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching posts: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});
// Get a specific post by ID
// Get post by ID with user profile URL and username
router.get('/getpost/:id', verifyToken, (req, res) => {
  const postId = req.params.id;
  const sql = `
      SELECT post.*, users.username, users.profileurl
      FROM post
      JOIN users ON post.user_id = users.id
      WHERE post.id = ?
  `;
  db.query(sql, [postId], (err, result) => {
      if (err) {
          console.error('Error fetching post:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }
      if (result.length === 0) {
          return res.status(404).json({ error: 'Post not found' });
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
  const sql = 'SELECT username,profileurl FROM users WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching username: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(result[0]);
  });
});
// Add a like to a post
router.post('/addlike', verifyToken, (req, res) => {
  const { post_id } = req.body;
  const likedBy = req.userId;

  const sql = 'INSERT INTO likes (likedby,postlikes) VALUES (?, ?)';
  db.query(sql, [likedBy,post_id], (err, result) => {
    if (err) {
      console.error('Error adding like: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json({ message: 'Like added successfully' });
  });
});
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
router.get('/getlikecount/:postId', verifyToken, (req, res) => {
  const postId = req.params.postId;
  const sql = 'SELECT COUNT(*) AS count FROM likes WHERE postlikes = ?';
  db.query(sql, [postId], (err, result) => {
    if (err) {
      console.error('Error fetching like count: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json({ count: result[0].count });
  });
});

// Get the number of comments for a specific post
router.get('/getcommentcount/:postId', verifyToken, (req, res) => {
  const postId = req.params.postId;
  const sql = 'SELECT COUNT(*) AS count FROM comments WHERE post_id = ?';
  db.query(sql, [postId], (err, result) => {
    if (err) {
      console.error('Error fetching comment count: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json({ count: result[0].count });
  });
});
router.post('/checklike', verifyToken, (req, res) => {
  const { post_id } = req.body;
  const likedBy = req.userId;

  const sql = 'SELECT * FROM likes WHERE likedby = ? AND postlikes = ?';
  db.query(sql, [likedBy, post_id], (err, result) => {
      if (err) {
          console.error('Error checking like:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (result.length > 0) {
          res.json({ liked: true });
      } else {
          res.json({ liked: false });
      }
  });
});
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../../Social-Media/frontend/public/Images/Posts');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });
router.post('/posts', upload.single('image'), async (req, res) => {
  try {
    const { description } = req.body;
    const userId = req.userId;

    const imagePath = req.file.filename;

    const query = 'INSERT INTO post (description, image, user_id) VALUES (?, ?, ?)';
    const values = [description, imagePath, userId];

    db.query(query, values, (error, results) => {
      if (error) {
        console.error('Error uploading data:', error);
        return res.status(500).json({ message: 'Error uploading data' });
      }

      res.status(201).json({ message: 'Post uploaded successfully', post: { id: results.insertId, description, image: imagePath, user_id: userId } });
    });
  } catch (error) {
    console.error('Error uploading data:', error);
    res.status(500).json({ message: 'Error uploading data' });
  }
});
// Add a friend
router.post('/addfriend', verifyToken, (req, res) => {
  const { friend_id } = req.body;
  const user_id = req.userId;
  const status = 'pending';

  // Check if a friend request already exists with the same friendReq and friendRes IDs
  const checkExistingRequestQuery = 'SELECT * FROM Friends WHERE (friendReq = ? AND friendRes = ?) OR (friendReq = ? AND friendRes = ?)';
  db.query(checkExistingRequestQuery, [user_id, friend_id, friend_id, user_id], (err, results) => {
    if (err) {
      console.error('Error checking existing friend request:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length > 0) {
      // Friend request already exists, send a message indicating the status
      const existingRequest = results[0];
      return res.json({ message: `Friend request with status '${existingRequest.status}' already exists` });
    }

    // No existing friend request, proceed to add a new one
    const insertFriendQuery = 'INSERT INTO Friends (friendReq, friendRes, status) VALUES (?, ?, ?)';
    db.query(insertFriendQuery, [user_id, friend_id, status], (err, result) => {
      if (err) {
        console.error('Error adding friend:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json({ message: 'Friend request sent successfully' });
    });
  });
});
router.get('/friendrequests', verifyToken, (req, res) => {
  const userId = req.userId;
  const sql = `
    SELECT users.username, friends.id
    FROM friends
    JOIN users ON friends.friendReq = users.id
    WHERE friends.friendRes = ? AND friends.status = 'pending'
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching friend requests: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json({ friendRequests: results });
  });
});

// Accept friend request
router.post('/acceptfriendrequest', verifyToken, (req, res) => {
  const { requestId } = req.body;
  const sql = 'UPDATE friends SET status = "accepted" WHERE id = ?';
  db.query(sql, [requestId], (err, result) => {
    if (err) {
      console.error('Error accepting friend request:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json({ message: 'Friend request accepted successfully' });
  });
});

// Reject friend request
router.post('/rejectfriendrequest', verifyToken, (req, res) => {
  const { requestId } = req.body;
  const sql = 'UPDATE friends SET status = "rejected" WHERE id = ?';
  db.query(sql, [requestId], (err, result) => {
    if (err) {
      console.error('Error rejecting friend request:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json({ message: 'Friend request rejected successfully' });
  });
});
// Updated userposts endpoint to include comment details
router.get('/userposts', verifyToken, (req, res) => {
  const userId = req.userId;

  const sql = `
  SELECT 
  post.id, 
  post.description, 
  post.image, 
  (
      SELECT COUNT(*) 
      FROM likes 
      WHERE post.id = likes.postlikes
  ) AS likes, 
  (
      SELECT COUNT(*) 
      FROM comments 
      WHERE post.id = comments.post_id
  ) AS comments
FROM post
WHERE post.user_id = ?
GROUP BY post.id, post.description
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user posts:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json({ posts: results });
  });
});

// New endpoint to fetch comments for a specific post
router.get('/post/:postId/comments', verifyToken, (req, res) => {
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


// Update the /togglelike endpoint to /likepost
router.post('/likepost', verifyToken, async (req, res) => {
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

const addFriend = async (req, res) => {
  const { friend_id } = req.body;
  const userId =req.userId;
console.log(userId);
  if (userId === friend_id) {
    return res.status(400).json({ message: 'You cannot add yourself as a friend.' });
  }

  const sqlCheck = `
    SELECT status 
    FROM friends 
    WHERE (friendReq = ? AND friendRes = ?) 
    OR (friendReq = ? AND friendRes = ?)
  `;

  const sqlInsert = `
    INSERT INTO friends (friendReq, friendRes, status) 
    VALUES (?, ?, 'pending')
  `;

  try {
    const [existingRequest] = await new Promise((resolve, reject) => {
      db.query(sqlCheck, [userId, friend_id, friend_id, userId], (err, result) => {
        if (err) {
          console.error('Error checking existing friend request:', err);
          reject(err);
        }
        resolve(result);
      });
    });

    if (existingRequest) {
      return res.json({ message: `Friend request already ${existingRequest.status}`, status: existingRequest.status });
    }

    await new Promise((resolve, reject) => {
      db.query(sqlInsert, [userId, friend_id], (err, result) => {
        if (err) {
          console.error('Error creating friend request:', err);
          reject(err);
        }
        resolve(result);
      });
    });

    res.json({ message: 'Friend request sent successfully', status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: 'Error processing friend request' });
  }
};


// Route for adding a friend
const getFriendStatus = async (req, res) => {
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

router.get('/friendstatus/:friendId', verifyToken, getFriendStatus);
// New endpoint to fetch a specific post with like count and comment count
router.get('/getpost/:id', verifyToken, async (req, res) => {
  const postId = req.params.id;
  try {
      const post = await getPostById(postId);
      res.json(post);
  } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/searchusers', verifyToken, (req, res) => {
  const userId = req.userId;
  const query = req.query.query;
  const sql = `SELECT id, username,profileurl FROM users WHERE username LIKE ? && id!=${userId}`;
  const values = [`%${query}%`];
  
  db.query(sql, values, (err, results) => {
    if (err) {
      console.error('Error searching users: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json(results);
  });
});
// Get all posts except those by the current user
router.get('/getuserdetails/:id', verifyToken, (req, res) => {
  const userId = req.params.id;
  const sql = `
    SELECT 
      users.username,
      (SELECT COUNT(*) FROM friends WHERE (friendReq = users.id OR friendRes = users.id) AND status = 'accepted') AS totalFriends,
      (SELECT COUNT(*) FROM likes WHERE likedby = users.id) AS totalLikes
    FROM users
    WHERE users.id = ?
  `;
  console.log('Fetching user details for ID:', userId); // Debugging line
  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching user details: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    console.log('User details result:', result); // Debugging line
    res.json(result[0]);
  });
});

router.get('/getuserposts/:id', verifyToken, (req, res) => {
  const userId = req.params.id;
  const sql = `
    SELECT 
      post.*, 
      users.username, 
      (SELECT COUNT(*) FROM likes WHERE likes.postlikes = post.id) AS likes,
      (SELECT COUNT(*) FROM comments WHERE comments.post_id = post.id) AS comments
    FROM post
    JOIN users ON post.user_id = users.id
    WHERE post.user_id = ?
  `;
  console.log('Fetching post for user ID:', userId); // Debugging line
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user post: ' + err.stack);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    console.log('User post result:', results); // Debugging line
    res.json(results);
  });
});




export default router;
