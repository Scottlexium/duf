const express = require('express');
const app = express()
const port = 4040
const bodyparser = require('body-parser');


app.set('view engine', 'ejs');
app.use(express.static('public'));;
app.set('views', 'views');

app.get('/', (req, res) => {
    res.render('index');
})
app.get('/about', (req, res) => {
    res.render('about');
});
app.get('/contact_us', (req, res) => {
    res.render('contact_us');
});
app.use('*', (req, res) => {
    res.status(404);
    res.render('404');
})
app.get('/favicon.ico', (req, res) => {
    res.status(200);
})
app.listen(port, () => console.log(`Listening on http://localhost:${port}`))