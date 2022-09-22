require('dotenv').config()
const express = require('express')
const body_parser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
const validateConfirmPassword = require('./validator')


const app = express()

app.use(express.static('public'))
app.use(body_parser.urlencoded({extended:true}))
app.set('view engine','ejs')

const url = process.env.DB_SERVER_LINK
mongoose.connect(url,()=>console.log('database connected successfully'))

const userSchema = new mongoose.Schema({
    username: String,
    fullname:String,
    password:String
})

const groupSchema = new mongoose.Schema({
    grouptitle:String,
    groupid: String,
    passkey: String,
    memebers: []
})

userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']})
groupSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFileds:['passkey']})

const User = mongoose.model('users',userSchema)
const Group = mongoose.model('groups',groupSchema)

app.get('/',(req,res)=>{
    res.render('login')
})

app.get('/signup',(req,res)=>{
    res.render('signup')
})

app.post('/signup',(req,res)=>{
    const fullname = req.body.fullname
    const username = req.body.email
    const password = req.body.password
    const re_password = req.body.re_password

    User.findOne({username: username},(err,usr)=>{
        if(!usr){
            if(password === re_password){
                const newUser = new User({
                    fullname:fullname,
                    username: username,
                    password: password
                })

                newUser.save((err)=>{
                    if(err){
                        console.log(err.message)
                    }else{
                        res.render('joinCreate')
                    }
                })
            }else{
                console.log('password dont match')
            }
        }else{
            console.log('username or email already exists')
        }
    })
})

app.post('/login',(req,res)=>{
    const username = req.body.email
    const password = req.body.password

    User.findOne({username: username},(err,foundedUser)=>{
        if(foundedUser){
            if(foundedUser.password === password){
                res.render('joinCreate')
            }else{
                console.log('incorrect password')
            }
        }else{
            console.log('account dont exist')
        }
    })
})

// TODO: Start working on the Create and Join Group Routes

app.post('/create',(req,res)=>{
    console.log(req.body)
    const grouptitle = req.body.grouptitle
    const groupid = req.body.groupid
    const passkey = req.body.passkey
    const re_passkey = req.body.passkey_re
    
    validateConfirmPassword.matchWithConformPassword(passkey,re_passkey)
    ?res.render('index')
    :res.render('joinCreate')
})

app.listen(3000, ()=>console.log('server is up and running on port 3000'))