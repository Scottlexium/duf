const express = require('express');
const app = express()
const bodyparser = require('body-parser');
const dotenv = require('dotenv')
dotenv.config();

const port = process.env.PORT || 4049
app.set('view engine', 'ejs');
app.use(express.static('public'));;
app.set('views', 'views');

app.get('/', (req, res) => {
    res.render('index', { title: "DUF" });
})
app.get('/about', (req, res) => {
    res.render('about');
});
app.get('/contact_us', (req, res) => {
    res.render('contact_us');
});
app.get('/try', (req, res) => {
    res.status(200).json({ name: "Scott" })
})
app.get('/favicon.ico', (req, res) => {
    res.status(200);
})
app.use('*', (req, res) => {
    res.status(404);
    res.render('404');
})

app.listen(port, () => console.log(`Listening on http://localhost:${port}`))