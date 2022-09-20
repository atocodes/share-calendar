const express = require('express')
const body_parser = require('body-parser')
const ejs = require('ejs')
const fs = require('fs')

const app = express()
app.set('view engine','ejs')
app.use(express.static('public'))
app.use(body_parser.urlencoded({extended:true}))

app.get('/',(req,res)=>{
    res.render('index')
})

app.post('/',(req,res)=>{
    console.log(req.body.dates)
})

app.listen(3000, ()=>console.log('server is up and running on port 3000'))