const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);
let thread_id
let delete_id
let reply_id

suite('Functional Tests', function() {
    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
        chai.request(server)
          .post('/api/threads/danTest')
          .send({
            text: 'example title',
            delete_password: 'mypass123',

          })
          .end(function(err, res){
              assert.equal(res.status, 200);
          });
          chai.request(server)
          .post('/api/threads/danTest')
          .send({
            text: 'will be deleted',
            delete_password: 'mypass123',

          })
          .end(function(err, res){
              assert.equal(res.status, 200);
              
          });
          done();
      });
      test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
        chai.request(server)
          .get('/api/threads/danTest')
          .end(function(err, res){
              assert.equal(res.status, 200);
              assert.isBelow(res.body.length, 11)
              assert.isBelow(res.body[0].replies.length, 4)
              assert.isArray(res.body)
              thread_id = res.body[0]._id
              delete_id = res.body[1]._id
              done();
          });
      });
      test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
        chai.request(server)
          .delete('/api/threads/danTest')
          .send({
            thread_id: delete_id,
            delete_password: 'wrongpassword',

          })
          .end(function(err, res){
              assert.equal(res.status, 200);
              assert.equal(res.text, "incorrect password")
              done();
          });
      });
      test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
        chai.request(server)
          .delete('/api/threads/danTest')
          .send({
            thread_id: delete_id,
            delete_password: 'mypass123',

          })
          .end(function(err, res){
              assert.equal(res.status, 200);
              assert.equal(res.text, "success")
              done();
          });
      });
      test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
        chai.request(server)
          .put('/api/threads/danTest')
          .send({
            thread_id: thread_id,

          })
          .end(function(err, res){
              assert.equal(res.status, 200);
              assert.equal(res.text, "reported")
              done();
          });
      });
      test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
        chai.request(server)
          .post('/api/replies/danTest')
          .send({
            thread_id: thread_id,
            text: "my reply",
            delete_password: "deletepass"
          })
          .end(function(err, res){
              assert.equal(res.status, 200);
              done();
          });
      });
      test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
        chai.request(server)
          .get('/api/replies/danTest')
          .query({
            thread_id: thread_id,
          })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isObject(res.body)
            assert.isArray(res.body.replies)
            reply_id = res.body.replies[0]._id
            done();
        });
      });
      test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
        chai.request(server)
          .delete('/api/replies/danTest')
          .send({
            thread_id: thread_id,
            reply_id: reply_id,
            delete_password: 'wrongpassword',

          })
          .end(function(err, res){
              assert.equal(res.status, 200);
              assert.equal(res.text, "incorrect password")
              done();
          });
      });
      test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
        chai.request(server)
          .delete('/api/replies/danTest')
          .send({
            thread_id: thread_id,
            reply_id: reply_id,
            delete_password: 'deletepass',

          })
          .end(function(err, res){
              assert.equal(res.status, 200);
              assert.equal(res.text, "success")
              done();
          });
      });
      test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
        chai.request(server)
          .put('/api/replies/danTest')
          .send({
            thread_id: thread_id,
            reply_id: reply_id,

          })
          .end(function(err, res){
              assert.equal(res.status, 200);
              assert.equal(res.text, "reported")
              done();
          });
      });
});
