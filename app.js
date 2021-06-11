//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const moment = require('moment');


const homeStartingContent = "This is a very simple blog website, which I created. It's not the point to have a blog or about writing. I built this site and I would appreciate if you could write a kind of review about the site or anything because it's still a blog so all posts are welcome. Basically I am asking help to test the site functioning. It's a milestone on my journey to become a webdeveloper. Also if you might be a coder/programmer I hope you could take look at the code on GitHub, the link is in the contacts.";
const aboutContent = "The base of the site it's from udemy where I follow Angela Yu's webdeveloper course. But I started to add my own part.The fornt end of this web app was coded with HTML CSS and Bootstrap. On the Back End I used NodeJS with express and MongoDB for the database with mongoose package. I tried to cover CRUD operation. EJS tamplate to views... Passport for authentication.";
const contactContent = "This is the link to the GitHub repository of the page. I am sure my code is a mess if you can give me advises or how to get better and cleaner code I would apprecite that Thank You";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/secretDB", {useNewUrlParser: true , useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);

let date = new Date();
let formatedDate = moment(date).format("DD-MM-YYYY");

let  loggedInUser = "";
const postSchema = new mongoose.Schema ({
  title: String,
  content: String,
  created: String,
  username:String
});
const userSchema = new mongoose.Schema ({
  username:String,
  password:String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User" , userSchema);
const Post = new mongoose.model("Post", postSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
      Post.find({},null,{sort:{created:1}}, function(err,posts){
         res.render("home", {
           startingContent: homeStartingContent,
           posts: posts,
           loggedInUser: loggedInUser
           });
       });
});

app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/compose", function(req, res){
  if(req.isAuthenticated()){
  res.render("compose");
}else{
  res.redirect("/login");
}
});

app.get("/profile" , function(req , res){
  if(req.isAuthenticated()){
    Post.find({username: req.user.username}, function(err,posts){
       res.render("profile", {
         posts: posts
         });
     });
}else{
  res.redirect("/login");
}

});

app.post("/compose", function(req, res){

  const post = new Post ({
    title: req.body.postTitle,
    content: req.body.postBody,
    created: formatedDate,
    username: req.user.username
  })

  post.save(function(err){
    if(!err){
      res.redirect("/");
    }
 });

});
app.get("/post/:postId",
function(req , res){
  Post.findOne({_id: req.params.postId}, function(err,post){
   res.render("post", {
     title: post.title,
     content: post.content
   });
 });
});

app.route("/mypost/:postId")
.get(function(req , res){
  Post.findOne({_id: req.params.postId}, function(err,post){
   res.render("mypost", {
     title: post.title,
     content: post.content ,
     postId: post.id
   });
 });
})
  .post(function(req , res){
  Post.deleteOne({_id: req.params.postId}, function(err,post){
    res.redirect("/profile")
  });
});

app.get("/publicprofile/:username" , function(req , res){
  Post.find({username:req.params.username} , function(err , posts){
    res.render("publicprofile" , { posts: posts});
  });
});

app.route("/update/:postId")
.get(function(req , res){
      Post.findOne({_id: req.params.postId},function(err , post){
      res.render("update", {
        title: post.title,
        content: post.content,
        postId: post.id
      });
});
})
.post(function(req , res){
   Post.updateOne({_id: req.params.postId},
     {title: req.body.postTitle , content: req.body.postBody , created:formatedDate},
      function(err){
       if(!err){
         res.redirect("/profile");
       }else{
         console.log(err);
       }
   });
  });


  app.get("/logout" , function(req ,res){
  req.logout();
Post.find({}, function(err,posts){
     res.render("home", {
       startingContent: homeStartingContent,
       posts: posts,
       loggedInUser: loggedInUser
     });
   });
  });


app.get("/login" ,function(req , res){
  res.render("login");
});




app.get("/register" ,function(req , res){
  res.render("register");
});


  app.post("/register" , function(req , res){

     User.register({username: req.body.username} , req.body.password , function(err , user){

       if(err){
         console.log(err);
         res.redirect("/register");

       }else{
         passport.authenticate("local")(req, res, function(){
          loggedInUser= req.body.username
        res.redirect("/");

      });
    }
     });
});


app.post("/login", function(req , res){
   const user = new User ({
     username: req.body.username,
     password: req.body.password
   });
 req.login(user , function(err){
   if(err){
     console.log(err);
   }else{
    passport.authenticate("local")(req, res, function(){
     loggedInUser = req.body.username;
    res.redirect("/");
 });
}
});
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
