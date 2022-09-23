require('dotenv').config()
const express = require('express')
const body_parser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
const validateConfirmPassword = require('./validator')
const LocalStorage = require('node-localstorage').LocalStorage
const localStorage = new LocalStorage('./scratch')

const app = express()
let login_id

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
    admin: userSchema,
    memebers: [
        userSchema
    ]
})

localStorage.clear()
userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:['password']})
groupSchema.plugin(encrypt,{secret:process.env.GROUPSECRET,encryptedFields:['passkey']})

const User = mongoose.model('users',userSchema)
const Group = mongoose.model('groups',groupSchema)

Group.find((err,groups)=>{
    if(!err){
        console.log(groups)
    }
})
app.get('/',(req,res)=>{
    const localStorage_data_ID = JSON.parse(localStorage.getItem('login_id'))
    if(localStorage_data_ID){
        User.findById(localStorage_data_ID.login_id,(err,usr)=>{
            if(!err){
                if(usr){
                    login_id = localStorage_data_ID.login_id
                    res.render('joinCreate')
                }else{
                    res.render('login')
                }
            }
        })
    }else{
        res.render('login')
    }
    // console.log(localStorage_data_ID)
    // console.log(login_id)
})

app.get('/signup',(req,res)=>{
    res.render('signup')
})

app.post('/signup',(req,res)=>{
    const fullname = req.body.fullname
    const username = req.body.email
    const password = req.body.password
    const re_password = req.body.re_password
    const rememeberMe = req.body.rememerMe

    
    User.findOne({username: username},(err,usr)=>{
        if(!err){
            if(!usr){
                if(password === re_password){
                    const newUser = new User({
                        fullname:fullname,
                        username: username,
                        password: password
                    })
    
                    newUser.save((err,newUser)=>{
                        if(err){
                            console.log(err.message)
                            res.render('404')
                        }else{
                            if(rememeberMe){
                                localStorage.setItem('login_id',JSON.stringify({login_id:login_id}))
                            }
                            res.render('joinCreate')
                        }
                    })
                }else{
                    console.log('password dont match')
                }
            }else{
                console.log('username or email already exists')
            }
        }else{
            res.render('404')
        }
    })
})

app.post('/login',(req,res)=>{
    const username = req.body.email
    const password = req.body.password
    const rememeberMe = req.body.rememerMe
    User.findOne({username: username},(err,foundedUser)=>{
        if(!err){
            if(foundedUser){
                if(foundedUser.password === password){
                    login_id = foundedUser._id
                    if(rememeberMe){
                        localStorage.setItem('login_id',JSON.stringify({login_id:login_id}))
                    }
                    res.render('joinCreate')
                }else{
                    console.log('incorrect password')
                    res.redirect('/login')
                }
            }else{
                console.log('account dont exist')
            }
        }else{
            res.render('404')
        }
    })
})

// TODO: Start working on the Create and Join Group Routes

app.post('/create',(req,res)=>{
    // console.log(req.body)
    const grouptitle = req.body.grouptitle
    const groupid = req.body.groupid
    const passkey = req.body.passkey
    const re_passkey = req.body.passkey_re

    const valid = validateConfirmPassword.matchWithConformPassword(passkey,re_passkey)

    Group.findOne({ groupid : groupid},(err,foundedGroup)=>{
        if(!foundedGroup){
            if(valid){
                console.log(login_id)
                User.findById(login_id,(err,usr)=>{
                    if(!err){
                        const newgroup = new Group({
                            grouptitle: grouptitle,
                            groupid: groupid,
                            passkey: passkey,
                            admin: usr,
                            memebers: [ ]
                        })

                        newgroup.save((err,grp)=>{
                            if(!err){
                                console.log(grp)
                                Group.findByIdAndUpdate(newgroup._id,{$push:{memebers:usr}},(err)=>{
                                    if(!err){

                                        res.render('index',{
                                            title: grp.grouptitle,
                                            memebers: grp.memebers
                                        })

                                        console.log(grp)
                                    }
                                })
                            }else{
                                console.log('error occured')
                                res.render('404')
                            }
                        })
                    }else{
                        console.log(err.message)
                        res.render('404')
                    }
                })
            }
        }else{
            console.log(foundedGroup)
            console.log('group exists')
        }
    })
    
})

app.post('/join',(req,res)=>{
    const groupId = req.body.groupid
    const groupPassKey = req.body.passkey
    Group.findOne({groupid: groupId},(err,group)=>{
        if(!err){
            if(group){
                if(group.passkey === groupPassKey){
                    
                    User.findById(login_id,(err,usr)=>{
                        
                        Group.findOne({memebers: {$eq : usr}},(err,membr)=>{
                            if(!err){
                                if(membr.length > 0){
                                    res.render('index',{
                                        title: group.grouptitle,
                                        memebers: group.memebers
                                    })
                                    console.log('joined')
                                    console.log(membr)

                                }else{
                                    Group.findByIdAndUpdate(group._id,{$push: {memebers: usr}},(err)=>{
                                        if(!err){
                                            res.render('index',{
                                                title: group.grouptitle,
                                                memebers: group.memebers
                                            })
                                        }else{
                                            res.render('404')
                                        }
                                    })
                                    console.log('not joined')
                                }
                            }else{
                                res.render('404')
                            }
                        })
                        // console.log(group)

                    })
                }else{
                    console.log('incorrect password')
                }
            }else{
                console.log('no group named')
            }
        }else{
            res.render('404')
        }
    })
})


app.listen(3000, ()=>console.log('server is up and running on port 3000'))