'use strict';
let mongoose      =require('mongoose');
const bcrypt      = require('bcrypt');
const saltRounds = 12;

const threadSchema = new mongoose.Schema({
  text: {type: String},
  created_on: {type: Date},
  bumped_on: {type: Date},
  reported: {type: Boolean, default: false},
  delete_password: {type: String},
  replies: [{
    text: {type: String},
    created_on: {type: Date},
    reported: {type: Boolean},
    delete_password: {type: String}
  }]

});
//let Stock = mongoose.model('stock', boardSchema)

const hashPassword = async function (password){
  let hashed_pwd = await bcrypt.hash(password, saltRounds)
  return hashed_pwd
}
const checkPassword = async function (password, hash){
  let pwd_ok = await bcrypt.compare(password, hash)
  return pwd_ok
}


const postThread = async (board, text, delete_password)=>{
  try{
    let Thread = await mongoose.model(board, threadSchema)
    let date = Date.now()
    let newThread = await new Thread({
    //let newThread = await Thread.create({
      text: text,
      delete_password: delete_password,
      created_on: date,
      bumped_on: date,
      reported: false,
      replies: [],

    })
    await newThread.save()
  }
  catch(err){
    return res.json(err)
  }
}
const getThread = async (board)=>{
  try{
    let Thread = await mongoose.model(board, threadSchema)
    let returnThread = await Thread.find({},['_id','text', 'created_on', 'bumped_on', 'replies'],{limit: 10, sort: {bumped_on: -1}}).lean().exec()
    let reply_count = 0
    for (let i=0;i<returnThread.length;i++){
      reply_count = returnThread[i].replies.length
      if (reply_count>3){
        returnThread[i].replies.sort(function(a,b){
          return new Date(b.created_on) - new Date(a.created_on);
        });
        returnThread[i].replies = returnThread[i].replies.slice(0, 3);
      }
      for (let j=0; j<returnThread[i].replies.length;j++){
        delete returnThread[i].replies[j].reported
        delete returnThread[i].replies[j].delete_password
      }
    }
    return returnThread
  }
  catch(err){
    return err
  }
}

const deleteThread = async (board, id, password="")=>{
  try{
    let Thread = await mongoose.model(board, threadSchema)
    let foundThread = await Thread.findById(id).exec()
    let hash = foundThread.delete_password
    let pass_check = await checkPassword(password, hash)
    //if password ok
    if (pass_check===true){
      await Thread.findByIdAndDelete(id)
      return "success"
    }
    else{
      return "incorrect password"
    }
  }
  catch(err){
    return err
  }
  
}

const putThread = async (board, id)=>{
  try{
    let Thread = await mongoose.model(board, threadSchema)
    let foundThread = await Thread.findById(id).exec()
    foundThread.reported = true
    await foundThread.save()
    //return foundThread.text
    return "reported"
  }
  catch(err){
    return err
  }
  
}

const postReply = async (board, id, password, text)=>{
  try{
    let Thread = await mongoose.model(board, threadSchema)
    let foundThread = await Thread.findById(id).exec()
    let date = Date.now()
    foundThread.bumped_on = date
    await foundThread.replies.push({
      text: text,
      created_on: date,
      delete_password: password,
      reported: false
    })
    await foundThread.save()
    //return foundThread
  }
  catch(err){
    return err
  }
  
}

const getReplies = async (board,thread)=>{
  try{
    let Thread = await mongoose.model(board, threadSchema)
    let returnThread = await Thread.findById(thread, ['_id','text', 'created_on', 'bumped_on', 'replies']).lean().exec()
    for (let i=0;i<returnThread.replies.length;i++){
      delete returnThread.replies[i].reported
      delete returnThread.replies[i].delete_password
    }
    return returnThread
  }
  catch(err){
    return err
  }
}

const deleteReply = async(board, thread_id, password="", reply_id)=>{
  try{
    let Thread = await mongoose.model(board, threadSchema)
    let foundThread = await Thread.findById(thread_id).exec()
    let hash
    for (let i=0;i<foundThread.replies.length;i++){
      hash = foundThread.replies[i].delete_password
      let pass_check = await checkPassword(password, hash)
      if (pass_check===true && reply_id==foundThread.replies[i]._id){
        foundThread.replies[i].text = "[deleted]"
        await foundThread.save()
        return "success"
      }

    }
    return "incorrect password"
  }
  catch(err){
    return err
  }
}

const putReply = async(board, thread_id, reply_id)=>{
  try{
    let Thread = await mongoose.model(board, threadSchema)
    let foundThread = await Thread.findById(thread_id).exec()
    for (let i=0;i<foundThread.replies.length;i++){
      if (reply_id==foundThread.replies[i]._id){
        foundThread.replies[i].reported = true
        await foundThread.save()
      }

    }
    return "reported"
  }
  catch(err){
    return err
  }
}

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .post(async function (req,res){
      let board = req.params.board
      let text = req.body.text
      let delete_password = req.body.delete_password
      let hashed_pwd = await hashPassword(delete_password)
      if (board){
        await postThread(board, text, hashed_pwd)
        
      }
      res.redirect("/b/" + board);
    })
    .get(async function (req,res){
      //console.log(req.params)
      let getThreads = await getThread(req.params.board)
      res.json(getThreads)
    })
    .delete(async function (req, res){
      let board = req.params.board
      let delete_password = req.body.delete_password
      let id = req.body.thread_id
      let ret = await deleteThread(board, id, delete_password)
      res.send(ret)
    })
    .put(async function (req, res){
      let board = req.params.board
      let id = req.body.thread_id
      let ret = await putThread(board, id)
      res.send(ret)
    });
  app.route('/api/replies/:board')
  .post(async function (req,res){
    let board = req.params.board
    let text = req.body.text
    let delete_password = req.body.delete_password
    let id = req.body.thread_id
    let hashed_pwd = await hashPassword(delete_password)
    if (board){
      let ret = await postReply(board, id, hashed_pwd, text)
      //res.json(ret)
    }
    return res.redirect("/b/" + board + "/" + id);
  })
  .get(async function (req,res){

    let replies = await getReplies(req.params.board, req.query.thread_id)
    res.json(replies)
  })
  .delete(async function (req,res){
    let board = req.params.board
    let delete_password = req.body.delete_password
    let thread_id = req.body.thread_id
    let reply_id = req.body.reply_id
    let ret = await deleteReply(board, thread_id, delete_password, reply_id)
    res.send(ret)
  })
  .put(async function (req,res){
    let board = req.params.board
    let thread_id = req.body.thread_id
    let reply_id = req.body.reply_id
    let ret = await putReply(board, thread_id, reply_id)
    res.send(ret)
  });
};
