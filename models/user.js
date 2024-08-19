const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
    email:{
        type : String,
        required : true

    }
})
//note by defualt passport provide us with username and password also salting and hashing there we use it here
     
    UserSchema.plugin(passportLocalMongoose);
    module.exports = mongoose.model("User", UserSchema);




