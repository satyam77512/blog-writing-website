const express = require('express');
const app = express();
const postModel = require('./models/post');
const userModel = require('./models/user.js');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'public')));



app.get('/',(req,res)=>{
    res.render('index');
});
app.get('/login',(req,res)=>{
    res.render('login');
});
app.get('/logout',(req,res)=>{
    res.cookie('token',"");
    res.redirect('/login');
})
app.get('/profile',isLoggedin,async (req,res)=>{
    let user = await userModel.findOne({email: req.user.email}).populate('posts');
    let allposts = await postModel.find().populate('user');
    res.render('profile',{user,allposts});
});
app.get('/like/:id',isLoggedin,async (req,res)=>{
    let post = await postModel.findOne({_id:req.params.id});
    if(post.likes.indexOf(req.user.userid) === -1)
    {
        post.likes.push(req.user.userid);
    }
    else
    {
        let index = post.likes.indexOf(req.user.userid);
        post.likes.splice(index,1);
    }
    await post.save();
    res.redirect('/profile');
});
app.get('/edit/:id',isLoggedin,async (req,res)=>{
    let post = await postModel.findOne({_id:req.params.id});
    res.render("edit",{post});  
});
app.get('/delete/:id',isLoggedin,async (req,res)=>{
    let userdel = await userModel.findOne({email: req.user.email});
    let index = userdel.posts.indexOf(req.params.id);
    userdel.posts.splice(index,1);
    await userdel.save();
    await postModel.findOneAndDelete({_id:req.params.id});
    res.redirect('/profile');
});
app.post('/update/:id',isLoggedin,async (req,res)=>{
    let updated = await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
    res.redirect('/profile');
})
app.post('/post',isLoggedin,async (req,res)=>{
    let user = await userModel.findOne({email:req.user.email});

    let post = await postModel.create({
        user:user._id,
        content:req.body.content
    })
    user.posts.push(post._id);
    await user.save(); // is field ko mai create krte time nhi fill kiya abhi kiya isiliye
    //save krna hoga
    res.redirect('/profile');
});
app.post('/login',async (req,res)=>{
    let {email,password} = req.body;
    // check if email exist
    let user = await userModel.findOne({email});
    if(!user) res.status(500).send('something went wrong');
    else{
        // password match
        bcrypt.compare(password,user.password,(err,result)=>{
            if(result)
            {
                let token = jwt.sign({email: email,userid: user._id},'secret');
                res.cookie('token',token);
                res.redirect('/profile');
            }
            else
            {
                res.status(500).send('something went wrong');
            }
        })
    }
});
app.post('/register',async (req,res)=>{
    let {name,username,email,password,age} = req.body;
    // check if email exist or not
    let user = await userModel.findOne({email:email});
    if(user)
        return res.status(500).send("this email is already registered");

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async (err,hash)=>{
           let createdUser = await userModel.create({
                name,
                username,
                email,
                password:hash,
                age
            })
            // res.send(createdUser);
            let token = jwt.sign({email: email,userid: createdUser._id},'secret');
            res.cookie('token',token);
            res.redirect('/profile');
        })
    })
});
function isLoggedin(req,res,next){
    if(req.cookies.token == "")
    {
        res.redirect('/login');
    }
    else
    {
        let data = jwt.verify(req.cookies.token,"secret");
        req.user = data;
        next();
    }
}

app.listen(3000);
