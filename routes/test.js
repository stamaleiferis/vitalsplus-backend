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
    const dbData = await req.db.collection("Student").find().toArray();
    res.json({'testData' : dbData});
});

router.get('/getStudent/:email', async (req, res, next) => {
    const dbData = await req.db.collection("Student").findOne({email: req.params.email})
    res.json({'student' : dbData});
});

router.get('/addData/:name/:email/:grade/:phone', async (req, res, next) => {
    const email = req.params.email;
    const name = req.params.name;
    const grade = req.params.grade;
    const phone = req.params.phone;
    await req.db.collection("Student").insert({
        name, email, grade, phone
    });
    const dbData = await req.db.collection("Student").find().toArray();
    res.json({'response' : dbData});
});

router.get('/data/clear', async (req, res, next) => {
    await req.db.collection("Staff").remove({});
    await req.db.collection("Student").remove({});
    await req.db.collection("User").remove({});
    res.json({'message' : 'deleted all records!'});
});

router.get('/data/clear/staff', async (req, res, next) => {
    await req.db.collection("Staff").remove({});
    res.json({'message' : 'deleted all staff records!'});
});

router.get('/data/clear/student', async (req, res, next) => {
    await req.db.collection("Student").remove({});
    res.json({'message' : 'deleted all student records!'});
});

router.get('/data/clear/user', async (req, res, next) => {
    await req.db.collection("User").remove({});
    res.json({'message' : 'deleted all user records!'});
});

router.get('/dataTest', async (req, res, next) => {
    //// TODO:

});

module.exports = router;
