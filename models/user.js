const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'user'],  // Only 'owner' or 'user' roles are allowed
    default: 'user'  // Default to 'user' role if not specified
  }
});

// Using passport-local-mongoose to handle authentication
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
