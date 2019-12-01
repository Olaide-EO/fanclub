/* eslint-disable consistent-return */
/* eslint-disable promise/always-return */
const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/FbAuth');

const cors = require('cors');
app.use(cors());

const { db } = require('./util/admin');

const { 
  getAllScreams, 
  postOneScream, 
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream  
} = require('./handlers/screams')
const { 
    signUp,
    login, 
    uploadImage, 
    addUserDetails, 
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
  } = require('./handlers/users');



//firebase deploy --only hosting:hollasport

 //scream route  
app.get('/scream', getAllScreams );
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);

//TODO: delete scream

app.delete('/scream/:screamId', FBAuth, deleteScream);

app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);


app.post('/scream/:screamId/comment', FBAuth, commentOnScream);

//users route
app.post('/signup', signUp)
app.post('/login', login)
app.post('/user/image', FBAuth, uploadImage)
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser)
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);


// eslint-disable-next-line consistent-return


exports.api = functions.https.onRequest(app);


exports.createNotificationOnLike = functions.firestore.document('/likes/:id')
       .onCreate((snapshot) => {
       return  db.doc(`/scream/${snapshot.data().screamId}`).get()
           .then(doc => {
             if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
               return db.doc(`/notifications/${snapshot.id}`).set({
                 createdAt: new Date().toISOString(),
                 recipient: doc.data().userHandle,
                 sender: snapshot.data().userHandleerHandle,
                 type: 'like',
                 read: false,
                 screamId: doc.id
               })
             }
           })
           .catch(err => {
             console.error(err);
           })
       })

exports.deleteNotificationOnUnLike = functions
    .firestore.document('/likes/:id')
             .onDelete((snapshot) => {
        return   db.doc(`/notifications/${snapshot.id}`)
                 .delete()
                 .catch((err) => {
                   console.error(err);
                   return
                 })
             })

exports.createNotificationOnComment = functions
    .firestore.document('/comments/:id')
    .onCreate((snapshot) => {
   return db.doc(`/scream/${snapshot.data().screamId}`).get()
        .then((doc) => {
          if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
            return db.doc(`/notifications/${snapshot.id}`).set({
              createdAt: new Date().toISOString(),
              recipient: doc.data().userHandle,
              sender: snapshot.data().userHandleerHandle,
              type: 'comment',
              read: false,
              screamId: doc.id
            })
          }
        })
        .catch(err => {
          console.error(err);
          return;
        })
    })

exports.onUserImageChange = functions.firestore
       .document('/users/:userId')
       .onUpdate((change) => {
         console.log(change.before.data());
         console.log(change.after.data());
        
         if(change.before.data().imageUrl !== change.after.data().imageUrl){
          console.log('image has changed')
          let batch = db.batch();
         return db.collection('scream')
                  .where('userHandle', '==', change.before.data().handle).get()
                 .then((data) => {
                  data.forEach(doc => {
                    const scream =db.doc(`/scream/${doc.id}`);
                    batch.update(scream, {userImage: change.after.data().imageUrl});
                  })
                  return batch.commit();
                 })
              } else return true;             
       })

exports.onScreamDelete = functions.firestore
             .document('/scream/{screamId}')
             .onDelete((snapshot, context) => {
               const screamId =context.params.screamId;
               const batch = db.batch();
               return db.collection('comments').where('screamId', '==', screamId).get()
                     .then(data => {
                       data.forEach(doc => {
                         batch.delete(db.doc(`/comments/${doc.id}`));
                       })
                       return db.collection('likes').where('screamId', '==', 'screamId').get();
                     })
                     .then(data => {
                      data.forEach(doc => {
                        batch.delete(db.doc(`/likes/${doc.id}`));
                      })
                      return db.collection('notifications').where('screamId', '==', 'screamId').get();
                    })
                    .then(data => {
                      data.forEach(doc => {
                        batch.delete(db.doc(`/notifications/${doc.id}`));
                      })
                      return batch.commit();
                    })
                    .catch((err) => {
                      console.error(err);
                      return;
                    })
             })

        
         