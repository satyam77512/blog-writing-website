const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://satyamyadav77512:satyam123@miniproject1.rqjxdc9.mongodb.net/?retryWrites=true&w=majority&appName=miniproject1");

const userSchema = mongoose.Schema({
    username:String,
    name:String,
    age:Number,
    email:String,
    password:String,
    posts:[ //array of objectID of type mongoose referenced to post.js
        {
            type: mongoose.Schema.Types.ObjectId,
            ref :"post"
        }
    ]
})

module.exports = mongoose.model('user',userSchema);