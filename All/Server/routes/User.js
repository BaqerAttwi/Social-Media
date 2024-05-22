// User.js
import bcrypt from 'bcrypt';

const saltRounds = 10;

class User {
  constructor(username, id) {
    this.username = username;
    this.id = id;
    
  }


  getUserDetails() {
    return {
      username: this.username,
      id: this.id,
    };
  }

  
}

export default User;
