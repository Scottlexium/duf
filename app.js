const express = require('express');
const app = express()
const bodyparser = require('body-parser');
const dotenv = require('dotenv');
const { json } = require('express/lib/response');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
dotenv.config();


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
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
app.get('/success', (req, res) => {
    res.render('success', { title: "DUF" });
})
app.post('/success', (req, res) => {
    console.log(req.body)
    // send email
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'Scottlexium@gmail.com',
            pass: 'xzelejpogqfdpcwk',
            //   the password above is just the one app password not the real 
            // account password.
        },
    });

    let mailOptions = {
        from: 'scottlexium@gmail.com',
        to: req.body.email,
        subject: `DUF Donaton Success!`,
        html: `<p>Dear ${req.body.name}, 
        Thank you for your kind donation of${req.body.amount} at Doers uplifitng foundation
        <a href='https://we-loan.herokuapp.com/profile/${docRef.id}'>DUF</>
        </br>
        Regards</br>
        DUF
        `,
    };

    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log(info)
            response.status(200).redirect('/success')
        }
    });
})
app.get('/favicon.ico', (req, res) => {
    res.status(200);
})
app.use('*', (req, res) => {
    res.status(404);
    res.render('404');
})

app.listen(port, () => console.log(`Listening on http://localhost:${port}`))