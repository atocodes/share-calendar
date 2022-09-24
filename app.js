require('dotenv').config()
const express = require('express')
const body_parser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
const cookieParser = require('cookie-parser')

const validate = require('./validator')
const session = require('express-session')
const { json } = require('body-parser')

const app = express()
let login_user

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

const groupJoiningFormat = {
    groupId:String,
    settedDays:Object
}

const userSchema = new mongoose.Schema({
    fullname:String,
    email:String,
    password:String,
    // ! admin:Boolean
    groupJoined:[]
})

const groupSchema = new mongoose.Schema({
    groupTitle : String,
    groupId : String,
    passkey : String,
    admin : String,
    memebers : []
})

userSchema.plugin(encrypt,{secret : process.env.SECRET, encryptedFields : ['password']})
groupSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields: ['passkey']})

const User = mongoose.model('users',userSchema)
const Group = mongoose.model('groups',groupSchema)

// Group.findOneAndUpdate({groupId:'@123'},{$set : {memebers : []}},(err,success)=>{
//     if(!err){
//         console.log(success)
//     }
// })

// Group.findOne({groupId :'@mhcda'},(err,group)=>{
//     console.log(group)
// })

app.get('/',(req,res)=>{
    // res.clearCookie('remember_me')
    // res.clearCookie('loginId') //! keep it to incase if you need to switch from user to user  using the cookie
    // console.log(req.cookies)
    // console.log(login_user)
    const cookie = req.cookies
    // console.log(cookie)
    // * join group check for password and id error 
    const noGroupId = req.session.noGroupId
    const wrongPasskey = req.session.wrongPasskey

    // * create group check for password conformation and id existance 
    const createGroupNotSamePassword = req.session.notSamePassword
    const createGroupIdUsed = req.session.groupIdUsed
    console.log(wrongPasskey)

    if(cookie.remember_me){
        const userID = cookie.loginId
        User.findById(userID, (err,user)=>{
            if(!err){
                login_user = user
                // console.log(login_user)
                res.render('joinCreate',{
                    noGroupId : noGroupId,//* join group no group id named
                    wrongPassKey: wrongPasskey,//* join group incorrect password
                    notSamePassword: createGroupNotSamePassword, //*create group not the same password
                    groupIdUsed: createGroupIdUsed//* create group group id exist
                })
            }else{
                res.render('404')
            }
        })
    }else{
        res.redirect('/login')
    }
})

app.get('/login',(req,res)=>{
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

// * logout event

app.get('/logout',(req,res)=>{
    res.clearCookie('remember_me')
    res.clearCookie('loginId')
    res.clearCookie('connect.sid')
    res.redirect('/')
})
// * login and signup route

app.post('/login',(req,res)=>{
    const email = req.body.email
    const password = req.body.password

    const rememeberMe = req.body.rememeberMe

    User.findOne({email:email},(err,user)=>{
        if(!err){
            if(user){
                
                if(user.password === password){
                
                    if(rememeberMe){
                        res.cookie('remember_me',true)
                    }
                    
                    res.cookie('loginId',user._id)
                    req.session.emailDontExist = false
                    req.session.incorrectPassword = false
                    res.render('joinCreate',{
                        noGroupId: false,
                        wrongPassKey: false,
                        notSamePassword: false, 
                        groupIdUsed: false
                    })
                }else{

                    req.session.incorrectPassword = true
                    res.redirect('/')
                }

            }else{
                req.session.emailDontExist = true
                res.redirect('/login')
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
                                res.cookie('remember_me','true')
                            }

                            res.cookie('loginId', savedUser._id)
                            // req.session.emailExist = false
                            res.redirect('/')
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

// * create and join group

// !the main app route
app.get('/:groupID',(req,res)=>{
   const groupId = req.params.groupID
   const userId = req.cookies.loginId
    Group.findOne({groupId : groupId },(err,group)=>{
        if(!err){
            if(group.admin === userId){
                Group.findOne({groupId : groupId}, (err,group)=>{
                    if(!err){
                        
                        res.render('index',{
                            data : group
                        })
                    }
                })
            }else{
                User.findById(userId,(err,user)=>{
                    if(!err){
                        Group.findOneAndUpdate({groupId : groupId},{$push : {memebers : user}},(err,group)=>{
                            if(!err){
                                groupJoiningFormat.groupId = group._id

                                if(user.groupJoined.length <= 0){
                                    User.findByIdAndUpdate(user._id,{$push : { groupJoined : groupJoiningFormat}},(err,success)=>{
                                        if(!err){
                                            console.log(success)
                                            res.redirect(`/${group.groupId}`)
                                        }
                                    })
                                }else{
                                    User.findByIdAndUpdate(user._id,{$push : { 'groupJoined.groupId' : {$ne : group._id}}},(err,success)=>{
                                        if(!err){
                                            console.log(success)
                                            res.redirect(`/${group.groupId}`)
                                        }
                                    })
                                }
                            }
                        })

                        
                    }
                })
                // console.log(group,userId)
                res.render('index',{
                    data : group
                })
            }
        }
    })

})

app.post('/join',(req,res)=>{

    const groupId = req.body.groupid
    const passKey = req.body.passkey

    Group.findOne({groupId : groupId},(err,group)=>{
        if(!err){
            if(group){
                if(group.passkey == passKey){

                    req.session.noGroupId = false
                    req.session.wrongPasskey = false

                    res.redirect(`/${group.groupId}`)

                }else{
                    req.session.noGroupId = false
                    req.session.wrongPasskey = true
                    res.redirect('/')
                    console.log('wrong password')
                }
            }else{
                req.session.noGroupId = true
                req.session.wrongPasskey = false
                res.redirect('/')
                console.log('no group named like that')
            }
        }
    })

})

app.post('/create',(req,res)=>{
    const grouptitle = req.body.grouptitle
    const groupid = req.body.groupid
    const passKey = req.body.passkey
    const passKey_re = req.body.passkey_re
    const admin = req.cookies.loginId //* the logged in user id from the cookie 
    const matchPass = validate.matchPassword(passKey,passKey_re)

    const newGroup = new Group({
        groupTitle : grouptitle,
        groupId : groupid,
        passkey: passKey,
        admin: admin
    })

        Group.findOne({groupId: groupid},(err,group)=>{
            if(!err){
                console.log(group)
                if(!group){
                    
                    if(matchPass){
                        
                        newGroup.save((err,newGroup)=>{

                            if(!err){

                                res.redirect(`/${groupid}`)
                            }else{

                                res.render('404')
                            }
                        })
                }else{
                    req.session.notSamePassword = true
                    req.session.groupIdUsed = false
                    res.redirect('/')
                    console.log('not same password')
                }

            }else{
                req.session.notSamePassword = false
                req.session.groupIdUsed = true
                res.redirect('/')
                console.log('group id used or exist')
            }
        }else{
            res.render('404')
        }
    })
})

app.post('/busydays',(req,res)=>{
    console.log(req.body)
})

// TODO:  working on the calander page user memeber.... on the ejs file


app.listen(3000,()=>console.log('server started at port 3000'))