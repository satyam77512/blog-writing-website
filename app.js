const express = require('express');
const app = express();
const postModel = require('./models/post');
const userModel = require('./models/user.js');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const upload = require('./config/multer');
const fs = require('fs');



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
app.get('/home',isLoggedin,async (req,res)=>{
    let user = await userModel.findOne({email: req.user.email}).populate('posts');
    let allposts = await postModel.find().populate('user');
    res.render('home',{user,allposts});
});
app.get('/create',isLoggedin,(req,res)=>{
    res.render('create',{user:req.user});
});
app.get('/mypost',isLoggedin,async (req,res)=>{
    let user = await userModel.findOne({email:req.user.email}).populate('posts');
    res.render('mypost',{user});
});
app.get('/profile',isLoggedin,async (req,res)=>{
    let user = await userModel.findOne({email:req.user.email});
    res.render('profile',{user});
})
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
    res.redirect('/home');
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
    let post = await postModel.findOne({_id:req.params.id});
    if(post.image)
    {
        let filename = post.image;
        const filepath = "./public/images/"+filename;
        fs.unlink(filepath,(err)=>{
            if(err)
                console.log('cannot delete image server error');
        })
    }
    await postModel.findOneAndDelete({_id:req.params.id});
    res.redirect('/mypost');
});
app.get('/search',isLoggedin,(req,res)=>{
    let user = null;
    let founduser = null;
    res.render('search',{founduser,user});
})
app.post('/update/:id',isLoggedin,async (req,res)=>{
    let updated = await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
    res.redirect('/mypost');
});
app.post('/find',isLoggedin,async(req,res)=>{
    let founduser = await userModel.findOne({email:req.body.email}).populate('posts');
    let user = await userModel.findOne({email:req.user.email});
    res.render('search',{founduser,user});
});
app.post('/post',isLoggedin,upload.single('postimage'),async (req,res)=>{
    let user = await userModel.findOne({email:req.user.email});
    let post;
    if(!req.file)
    {
        post = await postModel.create({
            user:user._id,
            content:req.body.content,
        })
    }
    else
    {
        post = await postModel.create({
            user:user._id,
            content:req.body.content,
            image:req.file.filename
        })
    }
    user.posts.push(post._id);
    await user.save(); // is field ko mai create krte time nhi fill kiya abhi kiya isiliye
    //save krna hoga
    res.redirect('/mypost');
});
app.post('/profileupload',isLoggedin,upload.single('profileimage'),async (req,res)=>{
    
    let user = await userModel.findOne({email:req.user.email});
    if(user.profileimage==='default.png')
    {
        user.profileimage = req.file.filename;
        await user.save();
    }
    else
    {
        let path = "./public/images/"+user.profileimage;
        fs.unlink(path,async (err)=>{
            if(!err)
            {
                user.profileimage = req.file.filename;
                await user.save();
            }
            else
            {
                console.log("error in updating");
            }
        })
    }
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
                res.redirect('/home');
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
                username,
                email,
                password:hash,
                age
            })
            // res.send(createdUser);
            let token = jwt.sign({email: email,userid: createdUser._id},'secret');
            res.cookie('token',token);
            res.redirect('/home');
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
