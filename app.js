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

const groupJoinedData = {
    groupId:String,
    settedDays:[]
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
    memebers : [],
    usersAndDaySettings:[]
})

userSchema.plugin(encrypt,{secret : process.env.SECRET, encryptedFields : ['password']})
groupSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields: ['passkey']})

const User = mongoose.model('users',userSchema)
const Group = mongoose.model('groups',groupSchema)

// Group.findOneAndUpdate({groupId:'@mhcda'},{$set : {usersAndDaySettings : []}},(err,success)=>{
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
    const creategroupIdExist = req.session.groupIdExist
    // console.log(wrongPasskey)

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
                    groupIdExist: creategroupIdExist//* create group group id exist
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

// * index web
app.get('/index/:groupid',(req,res)=>{
    const groupid = req.params.groupid
    let logedInUserFullName
    Group.findOne({groupId : groupid},(err,group)=>{
        if(!err && group){

            req.session.groupid = group._id
            User.findById(req.cookies.loginId,(err,user)=>{
                if(!err){
                    logedInUserFullName = user.fullname
                    console.log('group found and login:',true)
                    res.render('index',{
                        data:group,
                        logedInUserFullName : user.fullname.toUpperCase(),
                    })
                }
            })
        }else{
            console.log('group found and login:', false)
            res.render('404')
        }
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
                        groupIdExist: false
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

// * busy days
app.post('/busydays',(req,res)=>{
    const data = JSON.parse(req.body.dates)
    const userid = req.cookies.loginId
    const groupid = req.session.groupid
    // console.log(data,userid,groupid)
    console.log(groupid)
    console.log(userid)
    const set = {
        userid : userid,
        days : data,
        set : false
    }

    Group.findById(groupid,(err,group)=>{
        if(!err){
            const userSetting = group.usersAndDaySettings
            if(userSetting.length === 0){
                Group.findByIdAndUpdate(groupid,{$push : {usersAndDaySettings : set}},(err,success)=>{
                    if(!err){
                        console.log('first user day setting updated to the group data successfully',true)
                    }
                })
            }else{
                const users = userSetting.filter(user=>{
                    return user.userid === userid
                })
                if(users.length === 1){
                    console.log('user already set a date',true)
                }else{
                    set.set = true
                    Group.findByIdAndUpdate(groupid,{$push : {usersAndDaySettings : set}},(err,success)=>{
                        if(!err){
                            console.log('other memeber day setting updated to the group data successfully',true)
                        }
                    })
                }
            }

            User.findById(userid,(err,user)=>{
                if(!err){
                    console.log(user)
                }
            })
        }
    })
    // TODO: you better fix the repetation problem when ever the user updates the data!
})

// * create and join group

app.post('/join',(req,res)=>{
    const groupId = req.body.groupid
    const passkey = req.body.passkey
    const logedInUser = req.cookies.loginId

    Group.findOne({groupId : groupId},(err,group)=>{
        if(!err){
            if(group){
                if(group.passkey === passkey){

                    // * 'logn success => check for admin'
                    console.log('login success and correct password:',true)

                    if(group.admin === logedInUser){
                        groupJoinedData.groupId = 'admin'
                        
                        User.findByIdAndUpdate(logedInUser,{$push : {groupJoined : group._id}},(err,success)=>{
                            if(!err){
                                console.log('user profile successfully updated:',true)
                            }
                        })
                        console.log('user is admin:',true)
                        res.redirect(`/index/${group.groupId}`)
                    }else{
                        console.log('user is admin:',false)

                        // * group joined format
                        groupJoinedData.groupId = group._id
                        

                        // * user dont join any groups?
                        User.findById(logedInUser,(err,user)=>{
                            if(!err){
                                if(user.groupJoined.length === 0){
                                    console.log('user joined 0 groups:',false)

                                    User.findByIdAndUpdate(user._id,{$push : {groupJoined : group._id}},(err,success)=>{
                                        if(!err){
                                            console.log('user profile successfully updated:',true)
                                        }
                                    })
                                    // * if the user is first time joining the group so the user is new For the group too
                                    Group.findOneAndUpdate({groupId : groupId},{$push : {memebers : user}},(err,success)=>{
                                        if(!err){
                                            console.log('group memebers successfully updated:',true)
                                        }
                                    })

                                }else{
                                    User.findByIdAndUpdate(
                                        logedInUser,
                                        {$push:{groupJoined : {$ne : group._id}}},
                                        (err,success)=>{
                                            if(!err){
                                                console.log('user data successfuly updated:',true)
                                            }
                                        })
                                    console.log('user joined groups:',true)
                                }
                            }
                        })

                        res.redirect(`/index/${group.groupId}`)
                    }

                }else{
                    console.log('wrong passkey:',true)
                    req.session.wrongPasskey = true
                    res.redirect('/')
                }
            }else{

                req.session.noGroupId = true
                res.redirect('/')
            }
        }
    })
})

app.post('/create',(req,res)=>{
    const grouptitle = req.body.grouptitle
    const groupid = req.body.groupid
    const passkey = req.body.passkey
    const passkey_re = req.body.passkey_re

    const passwordMatch = validate.matchPassword(passkey,passkey_re)

    Group.findOne({groupId : groupid},(err,existingId)=>{
        if(!err){
            if(existingId){
                // ! group id used block
                console.log('Group ID Exists:',true)
                req.session.groupIdExist = true
                res.redirect('/')
                
            }else{
                console.log('Group ID Exists:',false)

                if(passwordMatch){
                    console.log('Password Match:',true)

                    
                    User.findById(req.cookies.loginId,(err,user)=>{
                        if(!err){
                            const newGroup = new Group({
                                groupId: groupid,
                                groupTitle : grouptitle,
                                passkey : passkey,
                                admin : req.cookies.loginId,
                                memebers: [user]
                            })
                            
                            newGroup.save((err,group)=>{
                                if(!err){
                                    console.log(group)
                                    console.log('group created:',true)
                                    res.redirect(`/index/${groupid}`)
                                }
                            })
                        }
                    })

                }else{
                    console.log('Password Match:',false)
                    req.session.notSamePassword = true
                    res.redirect('/')
                }
            }
        }
    })

    // console.log(req.body)
})
app.listen(3000,()=>console.log('server started at port 3000'))