const express = require('express')
const app = express()
const cors = require('cors')
const {MongoClient, ObjectId } = require('mongodb')
require('dotenv').config()
const PORT = 8000

let db,
    dbConnectionStr = process.env.DB_STRING,
    dbName = 'sample_mflix',
    collection

MongoClient.connect(dbConnectionStr)
    .then(client => {
        console.log('Connected to database')
        db = client.db(dbName)
        collection = db.collection('movies')
    })

//Middleware
app.use(express.urlencoded({extended : true}))
app.use(express.json())
app.use(cors())    


app.get("/search", async (request, response) => {
    try {
        let result = await collection.aggregate([
            {
                "$Search" : {
                    "autocomplete" : {
                        "query": `${request.query.query}`,
                        "path": "title",
                        //fuzz search means the user can make some spelling errors and it will still bring back the right option
                        "fuzzy": {
                            //Max edits -> The user can mess up up to 2 characters and mongo should still bring back the correct word. Can make 2 substitutions of characters when searching
                            "maxEdits": 2,
                            //Prefix length -> user has to type at least 3 characters in the word before it will start to search
                            "prefixLength": 3
                        }
                    }
                }
            }
        ]).toArray()//object sent back by mongo will be crazy, turn to array
        response.send(result)
    } catch (error){
        response.status(500).send({message: error.message})
    }
})

app.get("/get/:id", async (request,response) => {
    try{
        let result = await collection.findOne({
            "_id": ObjectId(request.params.id)
        })
        response.send(result)
    }catch (error){
        response.status(500).send({message: error.message})
    }
})

app.listen(process.env.PORT || PORT, () => {
    console.log('Server is running.')
})

