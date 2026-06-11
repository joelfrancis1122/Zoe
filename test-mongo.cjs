require('dotenv').config();
const mongoose = require('mongoose');

console.log("URI:", process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("SUCCESS!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("FAIL:", err);
    process.exit(1);
  });
