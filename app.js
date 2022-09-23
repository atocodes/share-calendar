require('dotenv').config()
const express = require('express')
const body_parser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
const cookieParser = require('cookie-parser')

const validate = require('./validator')
const session = require('express-session')

const app = express()

app.use(body_parser.urlencoded({extended:true}))
app.use(express.static('public'))
app.set('view engine','ejs')
app.use(cookieParser())
app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false
}))

mongoose.connect(process.env.DB_SERVER_LINK,(err)=>{
    if(!err){
        console.log('connection to DB => Success')
    }else{
        console.log('connection to DB => Fail')
    }
})

const userSchema = new mongoose.Schema({
    fullname:String,
    email:String,
    password:String,
    admin:Boolean
})

userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']})

const User = mongoose.model('users',userSchema)

app.get('/',(req,res)=>{
    const incorrect_password = req.session.incorrectPassword
    const emailDontExist = req.session.emailDontExist
    res.render('login',{
        incorrect_password: incorrect_password,
        emailDontExist: emailDontExist
    })
})

app.get('/signup',(req,res)=>{
    
    const emailExist = req.session.emailExist
    const matchPassword = req.session.matchPassword

    res.render('signup',{
        emailExist: emailExist,
        matchPassword: matchPassword
    })
})

app.post('/login',(req,res)=>{
    const email = req.body.email
    const password = req.body.password

    const rememeberMe = req.body.rememeberMe

    User.findOne({email:email},(err,user)=>{
        if(!err){
            if(user){
                
                if(user.password === password){
                
                    if(rememeberMe){
                        const login_id = user._id
                        res.cookie('loginId',login_id)
                    }

                    req.session.emailDontExist = false
                    req.session.incorrectPassword = false
                    res.render('joinCreate')
                }else{

                    req.session.incorrectPassword = true
                    res.redirect('/')
                }

            }else{
                req.session.emailDontExist = true
                res.redirect('/')
            }
        }
    })
})

app.post('/signup',(req,res)=>{
    // console.log(req.body)
    const fullname =  req.body.fullname
    const email = req.body.email
    const password = req.body.password
    const re_password = req.body.re_password

    const rememeberMe = req.body.rememeberMe
    const matchPasword = validate.matchPassword(password,re_password)

    if(matchPasword){
        const newUser =  new User({
            fullname: fullname,
            email: email,
            password: password
        })
        req.session.matchPassword = false
        User.findOne({email:email},(err,user)=>{
            if(!err){
                if(!user){

                    newUser.save((err,savedUser)=>{

                        if(!err){
            
                            if(rememeberMe){
            
                                const login_id = savedUser._id
                                res.cookie('loginId', login_id)
                            }
                            console.log('saved')
                            req.session.emailExist = false
                            res.render('joinCreate')
                        }else{
            
                            res.render('404')
                        }
                    })
                }else{
                    req.session.emailExist = true
                    res.redirect('/signup')
                }
            }
        })
    }else{
        req.session.matchPassword = true
        res.redirect('/signup')
    }
    
})
app.listen(3000,()=>console.log('server started at port 3000'))