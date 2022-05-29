//importing express
let express = require('express')
//importing mongodb
let {MongoClient,ObjectId} = require('mongodb')
//importing sanitize html
let sanitizeHTML = require('sanitize-html')
//calling express
let app = express()
//creating database variable db
let db
//
let port = process.env.PORT
if(port == null || port == ""){
    port = 3000
}
//make contents of folder available from the root of the server
app.use(express.static('public'))
//creating an async function
async function go(){
    //connection string to our database
    let client = new MongoClient('mongodb+srv://todoAppUser:yourpassword@cluster0.u4e20.mongodb.net/yourdatabasename?retryWrites=true&w=majority')
    //leverage client variable
    await client.connect()
    db = client.db()
    //begin listen for incoming requests
    app.listen(port)
}
//calling go function
go()

app.use(express.json())
//tell express to add all form values to body object and to the request object
app.use(express.urlencoded({extended: false}))
//creating security
function passwordProtected(req, res, next) {
    res.set("WWW-Authenticate", `Basic realm="Simple Todo App"`)
    console.log(req.headers.authorization)
    if(req.headers.authorization == "passwordhereforlogin"){
        next()
    }else{
        res.status(401).send("Authentication Required")
    }
}
//password protect the entire pages / all urls
app.use(passwordProtected)
//incoming request to homepage url
app.get('/', (req, res) => {
    //talk to the database
    db.collection('items').find().toArray((err , items) =>{
        //send the response for the homepage
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple To-Do App</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
    </head>
    <body>
    <div class="container">
        <h1 class="display-4 text-center py-1">To-Do App</h1>
        
        <div class="jumbotron p-3 shadow-sm">
        <form id="create-form" action="/create-item" method="POST">
            <div class="d-flex align-items-center">
            <input id="create-field" name="item" autofocus autocomplete="off" class="form-control mr-3" type="text" style="flex: 1;">
            <button class="btn btn-primary">Add New Item</button>
            </div>
        </form>
        </div>
        
        <ul id="item-list" class="list-group pb-5">
        
        </ul>   
    </div>
    <script>
    let items = ${JSON.stringify(items)}
    </script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="/browser.js"></script>
    </body>
    </html>
    `)
    })
})
//tell our server what to do if you get a post request to the homepage
app.post('/create-item' , (req, res) => {
    //not allowing external user to write html or javascript
    let safeText = sanitizeHTML(req.body.text, {allowedTags: [], allowedAttributes: {}})
    //create a new document in mongodb database
    db.collection('items').insertOne({text: safeText}, (err, info) => {
        res.json({_id: info.insertId, text: safeText})        
    })
})

app.post('/update-item',(req,res)=>{
    let safeText = sanitizeHTML(req.body.text, {allowedTags: [], allowedAttributes: {}})
    db.collection('items').findOneAndUpdate({_id: new ObjectId(req.body.id)},{$set: {text: safeText}},()=>{
        res.send('Success')
    })
})

app.post('/delete-item',(req,res)=>{
    db.collection('items').deleteOne({_id: new ObjectId(req.body.id)},()=>{
        res.send('Success')
    })
})