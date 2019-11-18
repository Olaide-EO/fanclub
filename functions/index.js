const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/FbAuth');

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
// eslint-disable-next-line consistent-return


exports.api = functions.https.onRequest(app);