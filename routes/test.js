var express = require('express');
var router = express.Router();

router.get('/testConnection', function(req, res, next) {
    res.json({'message':'connection is working!'});
  });

router.post('/testPost', function(req, res, next) {
    const param1 = req.body.param1;
    res.json({'param' : param1});
});

router.get('/getTestData', async (req, res, next) => {
    const dbData = await req.db.collection("Patient").find().toArray();
    res.json({'testData' : dbData});
});

router.get('/getPatient/:email', async (req, res, next) => {
    const dbData = await req.db.collection("Patient").findOne({email: req.params.email})
    res.json({'patient' : dbData});
});

router.get('/addData/:name/:email/', async (req, res, next) => {
    const email = req.params.email;
    const name = req.params.name;


    await req.db.collection("Patient").insert({
        name, email
    });
    const dbData = await req.db.collection("Patient").find().toArray();
    res.json({'response' : dbData});
});

router.get('/data/clear', async (req, res, next) => {
    await req.db.collection("Patient").remove({});
    await req.db.collection("User").remove({});
    await req.db.collection("ECG").remove({});
    res.json({'message' : 'deleted all records!'});
});

router.get('/data/clear/staff', async (req, res, next) => {
    await req.db.collection("Staff").remove({});
    res.json({'message' : 'deleted all staff records!'});
});

router.get('/data/clear/patient', async (req, res, next) => {
    await req.db.collection("Patient").remove({});
    res.json({'message' : 'deleted all patient records!'});
});

router.get('/data/clear/user', async (req, res, next) => {
    await req.db.collection("User").remove({});
    res.json({'message' : 'deleted all user records!'});
});

router.get('/dataTest', async (req, res, next) => {
    //// TODO:

});

module.exports = router;
