const express = require('express');
const app = express()
const bodyparser = require('body-parser');
const dotenv = require('dotenv');
const { json } = require('express/lib/response');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
dotenv.config();
const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave('FLWPUBK_TEST-358831fd4a1bd960ba6af24ed1b70f8d-X', 'FLWSECK_TEST-162072f145a90143747105037903713f-X');


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
    res.render('contact');
});
app.post('/contact_post',(req, res)=>{
    console.log(req.body)
    // res.status(200).json({msg:'Message Sent Successfully'})
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
        subject: `DUF message sent Successfully!`,
        html: `<p>Dear ${req.body.name}, 
        We have received your message on subject: ${req.body.subject} at Doers uplifitng foundation, regarding ${req.body.message}
        </br>
        we will respond as soon as
        </br>
        Regards</br>
        DUF
        `,
    };

    transporter.sendMail(mailOptions, function (err, info) {
        let smtpError = null;
        if (err) {
            console.log(err)
            if (err.code == 'EENVELOPE') {
                smtpError = 'No email provided, try refreshing!'
            }
            else{
                smtpError = 'Unknown Error!';
            }
            res.status(200).json({err:'An error occured!'})
        } else {
            console.log(info)
            smtpError = "Message sent Successfully!";
            res.status(200).json({msg:smtpError})
        }
        
    });
    // res.status(200).json({msg:'Message Sent Successfully'})
})

// the test section for flutterwave 
app.get('/flutterwave', (req, res) => {
    res.render('flutterwave');
});
app.post('/flutterwave', (req, res)=>{
    // In an Express-like app:

// The route where we initiate payment (Steps 1 - 3)
app.post('/pay', async (req, res) => {
    const payload = {
        card_number: req.body.card_number,
        cvv: req.body.card_cvv,
        expiry_month: req.body.card_expiry_month,
        expiry_year: req.body.card_expiry_year,
        currency: 'NGN',
        amount: 200,
        email: "techzide@gmail.com",
        fullname: "Scott Lexuim",
        // Generate a unique transaction reference
        tx_ref: generateTransactionReference(),
        redirect_url: `http://localhost:${port}/pay/redirect`,
        enckey: "FLWSECK_TEST5876912b69ea"
    }
    const response = await flw.Charge.card(payload);

    switch (response?.meta?.authorization?.mode) {
        case 'pin':
        case 'avs_noauth':
            // Store the current payload
            req.session.charge_payload = payload;
            // Now we'll show the user a form to enter
            // the requested fields (PIN or billing details)
            req.session.auth_fields = response.meta.authorization.fields;
            req.session.auth_mode = response.meta.authorization.mode;
            return res.redirect('/pay/authorize');
        case 'redirect':
            // Store the transaction ID
            // so we can look it up later with the flw_ref
            await redis.setAsync(`txref-${response.data.tx_ref}`, response.data.id);
            // Auth type is redirect,
            // so just redirect to the customer's bank
            const authUrl = response.meta.authorization.redirect;
            return res.redirect(authUrl);
        default:
            // No authorization needed; just verify the payment
            const transactionId = response.data.id;
            const transaction = await flw.Transaction.verify({ id: transactionId });
            if (transaction.data.status == "successful") {
                return res.redirect('/payment-successful');
            } else if (transaction.data.status == "pending") {
                // Schedule a job that polls for the status of the payment every 10 minutes
                transactionVerificationQueue.add({id: transactionId});
                return res.redirect('/payment-processing');
            } else {
                return res.redirect('/payment-failed');
            }
    }
});


// The route where we send the user's auth details (Step 4)
app.post('/pay/authorize', async (req, res) => {
    const payload = req.session.charge_payload;
    // Add the auth mode and requested fields to the payload,
    // then call chargeCard again
    payload.authorization = {
        mode: req.session.auth_mode,
    };
    req.session.auth_fields.forEach(field => {
        payload.authorization.field = req.body[field];
    });
    const response = await flw.Charge.card(payload);

    switch (response?.meta?.authorization?.mode) {
        case 'otp':
            // Show the user a form to enter the OTP
            req.session.flw_ref = response.data.flw_ref;
            return res.redirect('/pay/validate');
        case 'redirect':
            const authUrl = response.meta.authorization.redirect;
            return res.redirect(authUrl);
        default:
            // No validation needed; just verify the payment
            const transactionId = response.data.id;
            const transaction = await flw.Transaction.verify({ id: transactionId });
            if (transaction.data.status == "successful") {
                return res.redirect('/payment-successful');
            } else if (transaction.data.status == "pending") {
                // Schedule a job that polls for the status of the payment every 10 minutes
                transactionVerificationQueue.add({id: transactionId});
                return res.redirect('/payment-processing');
            } else {
                return res.redirect('/payment-failed');
            }
    }
});


// The route where we validate and verify the payment (Steps 5 - 6)
app.post('/pay/validate', async (req, res) => {
    const response = await flw.Charge.validate({
        otp: req.body.otp,
        flw_ref: req.session.flw_ref
    });
    if (response.data.status === 'successful' || response.data.status === 'pending') {
        // Verify the payment
        const transactionId = response.data.id;
        const transaction = flw.Transaction.verify({ id: transactionId });
        if (transaction.data.status == "successful") {
            return res.redirect('/payment-successful');
        } else if (transaction.data.status == "pending") {
            // Schedule a job that polls for the status of the payment every 10 minutes
            transactionVerificationQueue.add({id: transactionId});
            return res.redirect('/payment-processing');
        }
    }

    return res.redirect('/payment-failed');
});

// Our redirect_url. For 3DS payments, Flutterwave will redirect here after authorization,
// and we can verify the payment (Step 6)
app.post('/pay/redirect', async (req, res) => {
    if (req.query.status === 'successful' || req.query.status === 'pending') {
        // Verify the payment
        const txRef = req.query.tx_ref;
        const transactionId = await redis.getAsync(`txref-${txRef}`);
        const transaction = flw.Transaction.verify({ id: transactionId });
        if (transaction.data.status == "successful") {
            return res.redirect('/payment-successful');
        } else if (transaction.data.status == "pending") {
            // Schedule a job that polls for the status of the payment every 10 minutes
            transactionVerificationQueue.add({id: transactionId});
            return res.redirect('/payment-processing');
        }
    }

    return res.redirect('/payment-failed');
});

})
// test section ends here
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
        }
        res.render('success', { title: "DUF" });
    });
    res.render('success', {title:'DUF'})
})
app.get('/favicon.ico', (req, res) => {
    res.status(200)
})
app.use('*', (req, res) => {
    res.status(404);
    res.render('404');
})

app.listen(port, () => console.log(`Listening on http://localhost:${port}`))