var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');
var checkRole = require('../utils/handlers').checkRole;
var passport = require("passport");
var sendEmail = require('./helpers/emailHelpers').sendEmail


const HASH_COST = 10;

router.post('/add', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const grade = req.body.grade;
    const phone = req.body.phone;

    const role = "STUDENT"
    const emailVerified = false
    const approved = false
    // TODO: for email-based verification
    const verificationToken = crypto({length: 16});
    const passwordHash = await bcrypt.hash(req.body.password, HASH_COST);
    try {
        const studentAdded = await req.db.collection("Student").insert({
            name, email, grade, phone, emailVerified, approved
        });
        await req.db.collection("User").insert({
            email, passwordHash, verificationToken, role
        });
        await sendEmail(email,'noreply@school.edu','Verify Your Student Email','Email Body',verificationToken)
        res.json({
            message: 'Successfully added student',
            student: studentAdded
        });
    } catch (e) {
        res.json({
            message: 'Failed adding student'
        });
    }
    res.send()
});

router.get('/get/:email', async (req,res)=>{
  const email = req.params.email
  try {
      const studentData = await req.db.collection("Student").find({email: email}).toArray();
      const userData = await req.db.collection("User").find({email: email}).toArray();
      const role = userData.role
      let message = ''
      if (!studentData.length  || !userData.length){
        message = "Record doesn't exist"
      }else{
        message = "Successfully got student details"
      }
      res.json({
          message: message,
          student: studentData,
          user: userData
      });
  }catch(e){
    res.json({
        message: 'Database read error'
    });
  }
  res.send()
});

router.get('/status/:email', async (req,res)=>{
  const email = req.params.email
  try {
      const studentData = await req.db.collection("Student").find({email: email}).project({emailVerified:1,approved:1,_id:0}).toArray();
      if (studentData.length ){
      res.json({
          message: "Successfully got status",
          emailVerified: studentData[0].emailVerified,
          approved: studentData[0].approved
        });
      res.send()
      }
  }catch(e){
    res.json({
        message: "Error",
      });
    res.send()
  }
});

router.get('/verification/:email/:verificationToken', async (req,res)=>{
  const email = req.params.email
  const verificationToken = req.params.verificationToken
  const dbData = await req.db.collection("User").find({email: email}).project({verificationToken:1,_id:0}).toArray();
  let success = false
  //TODO: assert dbData.length == 1
  if (dbData[0]['verificationToken'] == verificationToken){
    try{
      verificationResult = await req.db.collection("Student").findAndModify({email: email},{cno:1},{"$set":{emailVerified: true}})
      success = true
    }catch(e){

    }
  }
  res.json({
    Success:success
  });
  res.send()
});

router.post('/delete', async (req,res)=>{
  email = req.body.email
  //TODO: assert email.length == 1
  await req.db.collection("Student").deleteOne({email:email})
  res.send()
});

// TODO: for testing checkRole handler
router.get('/onlyStudent', checkRole("STUDENT"), passport.authenticate('jwt', {session: false}), (req, res, next) => {
    res.status(200).send("You now have secret knowledge!");
});

module.exports = router;
