var express = require('express');
var router = express.Router();
var crypto = require('crypto-random-string');
var bcrypt = require('bcrypt');
var sendEmail = require('./helpers/emailHelpers').sendEmail

const HASH_COST = 10;

router.post('/add', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const phone = req.body.phone;
    const emailVerified = false;
    const approved = false;
    const role = "staff"
    const verificationToken = crypto({length: 16});
    const passwordHash = await bcrypt.hash(req.body.password, HASH_COST);
    try {
        //TODO: check if email is already in database
        const staffAdded = await req.db.collection("Staff").insert({
            name, email, phone, emailVerified, approved
        });
        await req.db.collection("User").insert({
            email, passwordHash, role, verificationToken
        });
        res.json({
            message: 'Successfully added '+ role,
            staff: staffAdded
        });
        await sendEmail(email,'noreply@school.edu','Verify Your Staff Email','Email Body',verificationToken)
    } catch (e) {
        res.json({
            message: 'Failed adding' + role
        });
    }
    res.send()

});

router.get('verification/:email/:verificationToken', async (req,res)=>{
  const email = req.params.email
  const verificationToken = req.params.verificationToken
  const dbData = await req.db.collection("User").find({email: email}).project({verificationToken:1,_id:0}).toArray();
  let success = false
  //TODO: assert dbData.length == 1
  if (dbData[0]['verificationToken'] == verificationToken){
    try{
      verificationResult = await req.db.collection("Staff").findAndModify({email: email},{cno:1},{"$set":{emailVerified: true}})
      success = true
    }catch(e){

    }
  }
  res.json({
    Success:success
  });
  res.send()
});

router.post('/sendMessages', async (req, res) => {
    const grades = req.body.grades;
    const subject = req.body.subject;
    const body = req.body.body;
    const email_from = "noreply@school.edu"

    //TODO: body and html
    try {
        const dbData = await req.db.collection("Student").find({grade: grades}).project({email:1, _id:0}).toArray();
        await sendEmail(dbData,email_from,subject,body,'TODO');
        res.json({
          message:'Success'
        })

    } catch (e) {

        res.json({
            message: 'Failed'
        });
    }
    res.send()
});

router.post('/sendMessage', async (req, res) => {
  email = req.body.emails
  subject = req.body.subject
  msg = req.body.msg
  from = 'TODO@todo.todo'

  try{
    await sendEmail(email,from,subject,msg,'TODO');
    res.json({
      message:'Success'
    })
  }catch(e){
    res.json({
      message:'Failure'
    })
  }


});

router.post('/invite/students', async (req,res)=>{
  emails = req.body.email
  grade = req.body.grade
  const role = "student"
  const emailVerified = false
  const approved = true
  //TODO: check if emails already exist in database
  //TODO: use sendgrid to validate emails
  //TODO: assert all lengths equal
  emails_dict = emails.map(x=>{return {email:x}})
  users_dict = emails.map(x=>{return {email:x,verificationToken:crypto({length: 16}),role:role }})
  //records = names.map((x,i)=>[{name:x,email:emails[i],grade:grades[i],phone:phones[i],passwordHash:await bcrypt.hash(req.body.password[i], HASH_COST),verificationToken:crypto({length: 16})}])
  try{
    await req.db.collection('Student').insertMany(emails_dict)
    await req.db.collection("User").insertMany(users_dict)
    await sendEmail(emails,'noreply@school.edu','Verify Your Student Email','Email Body','html')
    res.json({
        message: 'Successfully invited students',
        student: emails
    });
  }catch(e){
    res.json({
        message: 'Failed inviting students'
    });
  }
  res.send()
});

//TODO: add route students/:grade to get all students of specific grade
router.get('/students', async (req,res)=>{

  try {
      const dbData = await req.db.collection("Student").find().toArray();
      res.json({
          message: 'Successfully got student records',
          students: dbData
      });
  }catch(e){
    res.json({
        message: 'Failed to get student records'
    });
  }
  res.send()
});

router.get('/staff', async (req,res)=>{

  try {
      const dbDataStaff = await req.db.collection("Staff").find().toArray();
      const dbDataUser = await req.db.collection("User").find().toArray();
      res.json({
          message: 'Successfully got staff records',
          staff: dbDataStaff,
          user: dbDataUser
      });
  }catch(e){
    res.json({
        message: 'Failed to get staff records'
    });
  }
  res.send()
});

router.get('/get/:email', async (req,res)=>{
  const email = req.params.email
  try {
      const staffData = await req.db.collection("Staff").find({email: email}).toArray();
      const userData = await req.db.collection("User").find({email: email}).toArray();
      const role = userData.role
      let message = ''
      if (!staffData.length  || !userData.length){
        message = "Record doesn't exist"
      }else{
        message = "Successfully got staff details"
      }
      res.json({
          message: message,
          staff: staffData,
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
      const staffData = await req.db.collection("Staff").find({email: email}).project({emailVerified:1,approved:1,_id:0}).toArray();
      if (staffData.length ){
      res.json({
          message: "Successfully got status",
          emailVerified: staffData[0].emailVerified,
          approved: staffData[0].approved
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

module.exports = router;
