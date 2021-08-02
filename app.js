require('dotenv').config();
const express=require("express");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy=require("passport-facebook");




const findOrCreate=require("mongoose-findorcreate");
const app =express();



app.use(express.static("public"));
app.set("view-engine",'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));


app.use(session({
    secret:"our little secret.",
    resave:false,
    saveUninitialized:false
 

}))
app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb+srv://rkgritesh50:Ritesh2308@cluster0.y4eto.mongodb.net/userDB",{useNewUrlParser:true});
mongoose.set("useCreateIndex",true);

const userSchema= new mongoose.Schema({
    email:String,
    password:String,
    name:String,
    googleId:String,
    facebookId:String,
    secret:String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);



const User=new mongoose.model("User",userSchema);
passport.use(User.createStrategy());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://stark-bastion-06309.herokuapp.com/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
  
    

    User.findOrCreate({ googleId: profile.id ,name:profile.displayName }, function (err, user) {
      return cb(err, user);
    });
  }
));


passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "https://stark-bastion-06309.herokuapp.com/auth/facebook/secrets"
},
function(accessToken, refreshToken, profile, cb) {
 
  

  User.findOrCreate({ facebookId: profile.id , name:profile.displayName }, function (err, user) {
    return cb(err, user);
  });
}
));






passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });




app.get("/",function(req,res)
{
    res.render("home.ejs");
})
app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

  app.get('/auth/facebook',
  passport.authenticate('facebook'));

 app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
  



app.get("/login",function(req,res){
    res.render("login.ejs");
})

app.get("/logout",function(req,res)
{
    req.logout();
    res.redirect("/");
})

app.get("/secrets",function(req,res)
{ 
  if(req.user)
  {
  
    res.render("secrets.ejs",{n:req.user,usersWithSecrets:0});
  }
  
else{
 User.find({"secret":{$ne: null}},function(err,foundUsers)
  {
    if(err){
      console.log(err);
    }
    else{
      if(foundUsers)
      {
        res.render("secrets.ejs",{n:0,usersWithSecrets:foundUsers});
      }

    }
  })
}
})

app.get("/submit",function(req,res)
{
   
  


  if(req.user)
  {
    res.render("submit.ejs");
  }
  else{
    res.redirect("/login");
  }
})

app.post("/submit",function(req,res)
{
 
   
    User.findById(req.user.id,function(err,foundUser)
    {
       if(err)
       {
         console.log(err);
       }
       else
       {
         if(foundUser)
         {
           foundUser.secret=req.body.secret;
           foundUser.save(function(){
             res.redirect("/secrets");
           });
         }
       }
    })
  
  
  
 

})












app.get("/register",function(req,res){
   res.render("register.ejs");
    
})

app.post("/register",function(req,res){

    User.register({name:req.body.name,username:req.body.username},req.body.password,function(err,user){
        if(err)
        {
            console.log(err);
            res.render("register.ejs");
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
  })


app.post("/login",function(req,res){
 
     const user=new User({
         username:req.body.username,
         password:req.body.password

     });
     req.login(user,function(err)
     
     {
         if(err)
         {
           console.log(err);  
         }
         else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
         }
     })
  



   
})



let port =process.env.PORT;
if(port==null||port == ""){
  port=3000;
}



app.listen(port,function(){
    console.log("server is up");
})