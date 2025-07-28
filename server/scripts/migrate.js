const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config'); // Adjust the path based on your config.js location
const User = require('../models/User'); // Adjust the path based on your models/User.js location

// Connect to MongoDB using your config
mongoose.connect(config.mongoURI || 'mongodb://localhost:27017/your-database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function runMigrations() {
  try {
    // Migration 1: Add phone field to existing users
    console.log('Adding phone field to existing users...');
    await User.updateMany({}, { $set: { phone: null } }, { strict: false });
    console.log('Phone field added successfully.');

    // Migration 2: Hash existing plain text passwords
    console.log('Hashing existing passwords...');
    const users = await User.find();
    for (const user of users) {
      if (!user.password.startsWith('$2a$')) { // Check if password is not hashed
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();
      }
    }
    console.log('Password migration complete.');

    // Close the connection
    await mongoose.connection.close();
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();