const { admin, db } = require('../util/admin')


exports.getAllScreams = (req, res) => {
    db
     .collection('scream')
     .orderBy('createdAt', 'desc')
     .get()
.then(data => {
    let scream = [];
    data.forEach(doc => {
        scream.push({
            screamId: doc.id,
            body: doc.data().body,
            userHandle: doc.data().userHandle,
            createdAt: new Date().toISOString()
        })
    });
    return res.json(scream);
})
.catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.code});
});

}

exports.postOneScream =  (req, res) => {
    const newScream = {
       body: req.body.body,
       userHandle: req.user.handle,
       createdAt: admin.firestore.Timestamp.fromDate(new Date())
   };

       db
        .collection('scream')
        .add(newScream)
        .then((doc) => {
        return  res.json({message: `document ${doc.id} created successfully`});
        })
        .catch((err) => {
           console.log(err);
           
           return  res.status(500).json({ error: `something went wrong`});
           });
}


//fetch one scream

exports.getScream = (req, res) => {
    let screamData = {}
    db.doc(`/scream/${req.params.screamId}`).get()
    .then(doc => {
        if(!doc.exists){
            return res.status(404).json({ error: 'Scream not found'});
        }
        screamData = doc.data();
        screamData.screamId = doc.id;
         return db.collection('comments')
                  .orderBy('createdAt', 'desc')
                  .where('screamId', '==', req.params.screamId)
                  .get();
    })
    .then(data => {
        screamData.comments = [];
        data.forEach(doc => {
            screamData.comments.push(doc.data());
        });
        return res.json(screamData)
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code});
    })
}

// Comment on a scream

exports.commentOnScream = (req, res) => {
    if(req.body.body.trim() === ''){
        return res.status(400).json({ error: 'Must not be empty'});
    }
    
    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        screamId: req.params.screamId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    };
    db.doc(`/scream/${req.params.screamId}`).get()
      .then(doc => {
          if(!doc.exists){
              return res.status(404).json({ error: 'Scream not found'});
          }
          return db.collection('comments').add(newComment);
      })
      .then(() => {
        return  res.json(newComment);
      })
      .catch(err => {
          console.log(err);
          res.status(500).json({ error: 'Something went wrong' });
      })
}