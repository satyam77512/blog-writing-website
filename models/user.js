const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/project1");
const userSchema = mongoose.Schema({
    username:String,
    age:Number,
    email:String,
    password:String,
    posts:[ //array of objectID of type mongoose referenced to post.js
        {
            type: mongoose.Schema.Types.ObjectId,
            ref :"post"
        }
    ],
    profileimage:{
        type:String,
        default:"default.png"
    }
})

module.exports = mongoose.model('user',userSchema);

