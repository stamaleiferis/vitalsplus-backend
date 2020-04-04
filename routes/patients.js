var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');
var checkRole = require('../utils/handlers').checkRole;
var passport = require("passport");
var sendEmail = require('./helpers/emailHelpers').sendEmail
const ObjectID = require('mongodb').ObjectID;


const HASH_COST = 10;

router.post('/profile', async (req, res) => {
  const email = req.body.email;
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const phone = req.body.phone;
  const password = req.body.password

  const weight = req.body.weight
  const height = req.body.height
  const conditions = req.body.conditions
  const medication = req.body.medication
  const dob = req.body.dob
  const ecg_id = []

  const role = "PATIENT"
  const emailVerified = false
  const approved = false

  const verificationToken = crypto({length: 16});
  const passwordHash = await bcrypt.hash(password, HASH_COST);
  try {
      const patientAdded = await req.db.collection("Patient").insert({
          first_name, last_name, email, phone, weight, height,conditions,medication,dob,ecg_id, emailVerified, approved, passwordHash,verificationToken,role
      });
      //await sendEmail(email,'noreply@school.edu','Verify Your Patient Email','Email Body',verificationToken)
      res.json({
          message: 'Successfully added patient',
          patient: patientAdded
      });
  } catch (e) {
    console.log(e)
      res.json({
          message: 'Failed adding Patient'
      });
  }
  res.send()
});


router.delete('/profile/:id', async (req, res) => {
  const id = req.params.id
  try{
    await req.db.collection("Patient").remove({_id: new ObjectID(id)});
    res.json({
        message: 'Successfully removed patient',
        success: true
    });
  }catch(e){
    console.log("Error deleting: "+e)
    res.json({
        message: 'Failed to removed patient',
        success: false
    });
  }
  res.send()
});

router.post('/ecg/:id', async (req, res) => {
  const patient_id = req.params.id //patient ID
  const timestamp = req.body.timestamp
  const duration = req.body.duration
  const sample_rate = req.body.sample_rate
  const samples = req.body.samples
  const r_peaks = req.body.r_peaks
  const avg_ht = req.body.avg_ht
  const afib = ""

  try {
      const ecgRecordAdded = await req.db.collection("ECG").insertOne({
          patient_id, timestamp, duration, sample_rate, samples, r_peaks,avg_ht,afib
      });
      const ecgId = ecgRecordAdded.ops[0]._id
      console.log("OPS: "+ecgRecordAdded.ops[0])
      console.log("ECG ID: "+ ecgId)
      const ecgPatientAdded = await req.db.collection("Patient").updateOne({_id: new ObjectID(patient_id)},{$push:{ecg_id: ecgId}})
      res.json({
          message: 'Successfully added ECG record',
          record: ecgRecordAdded,
          patient: ecgPatientAdded,
          success: true
      });
  } catch (e) {
    console.log(e)
      res.json({
          message: 'Failed adding ECG record',
          success: false
      });
  }
  res.send()


});


////////////////////////////////////////////////

router.post('/add', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const grade = req.body.grade;
    const phone = req.body.phone;

    const role = "patient"
    const emailVerified = false
    const approved = false
    // TODO: for email-based verification
    const verificationToken = crypto({length: 16});
    const passwordHash = await bcrypt.hash(req.body.password, HASH_COST);
    try {
        const patientAdded = await req.db.collection("Patient").insert({
            name, email, grade, phone, emailVerified, approved
        });
        await req.db.collection("User").insert({
            email, passwordHash, verificationToken, role
        });
        await sendEmail(email,'noreply@school.edu','Verify Your Patient Email','Email Body',verificationToken)
        res.json({
            message: 'Successfully added patient',
            patient: patientAdded
        });
    } catch (e) {
        res.json({
            message: 'Failed adding Patient'
        });
    }
    res.send()
});

router.get('/get/:email', async (req,res)=>{
  const email = req.params.email
  try {
      const patientData = await req.db.collection("Patient").find({email: email}).toArray();
      const userData = await req.db.collection("User").find({email: email}).toArray();
      const role = userData.role
      let message = ''
      if (!patientData.length  || !userData.length){
        message = "Record doesn't exist"
      }else{
        message = "Successfully got patient details"
      }
      res.json({
          message: message,
          patient: patientData,
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
      const patientData = await req.db.collection("Patient").find({email: email}).project({emailVerified:1,approved:1,_id:0}).toArray();
      if (patientData.length ){
      res.json({
          message: "Successfully got status",
          emailVerified: patientData[0].emailVerified,
          approved: patientData[0].approved
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
      verificationResult = await req.db.collection("Patient").findAndModify({email: email},{cno:1},{"$set":{emailVerified: true}})
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
  await req.db.collection("Patient").deleteOne({email:email})
  res.send()
});

// TODO: for testing checkRole handler
router.get('/onlyPatient', checkRole("patient"), passport.authenticate('jwt', {session: false}), (req, res, next) => {
    res.status(200).send("You now have secret knowledge!");
});

module.exports = router;
