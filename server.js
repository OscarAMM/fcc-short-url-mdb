require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
var bodyParser = require('body-parser');

// Basic Configuration
const port = process.env.PORT || 3000;
//gets body input forms
//database connection with env file
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
/**Moongose schemas**/
let url_schema = new mongoose.Schema({
    original: { type: String, required: true },
    short: { type: Number }
});
let Url = mongoose.model('Url', url_schema);
/**mongoose end schemas */
/**empty object */

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
    res.json({ greeting: 'hello API' });
});
let response_json_object = {}
app.post('/api/shorturl/new', bodyParser.urlencoded({ extended: false }) ,function (req, res) {
    let inputUrl = req.body.url;
    let regex = new RegExp(/^[http://www.]/);
    
    if(!inputUrl.match(regex)){
        res.json({
            error: 'Invalid URL'
        });
        return
    }
    response_json_object['original_url'] = inputUrl;
    let short_url = 1;
    Url.findOne({})
        .sort({ short: 'desc' })
        .exec((error, result) => {
            if (!error && result != undefined) {
                short_url = result.short + 1;
            }
            if (!error) {
                Url.findOneAndUpdate(
                    { original: inputUrl },
                    { original: inputUrl, short: short_url },
                    { new: true, upsert: true },
                    (error, url_saved) => {
                        if (!error) {
                            response_json_object['short_url'] = url_saved.short
                            res.json(response_json_object);
                        }
                    }
                )
            }
        });
});
app.get('/api/shorturl/:number', function(req,res){
    let number = req.params.number;
    Url.findOne({short:number}, function (error, result){
        if(!error && result != undefined){
            res.redirect(result.original);
        }else{
            res.json({
                error: 'not found'
            });
        }
    });
});
app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
