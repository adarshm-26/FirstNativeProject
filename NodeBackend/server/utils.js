const authAdmin = require('firebase-admin');

exports.getFields = (payload) => {
  const { sub, name, email, email_verified, phone_number } = payload;
  switch(payload.firebase.sign_in_provider) {
    case 'google.com':
      return {
        _id: sub,
        firstname: name.split(' ')[0],
        lastname: name.split(' ')[1],
        email: email,
        emailVerified: email_verified
      };
    case 'facebook.com':
      return {
        _id: sub,
        firstname: name.split(' ')[0],
        lastname: name.split(' ')[1]
      };
    case 'phone':
      return { 
        _id: sub,
        phone: phone_number 
      };
    default:
      return {}
  }
}

exports.verifyRequest = (req, res, next) => {
  const authorizationString = req.headers.authorization;
  let token = '';

  if (authorizationString && authorizationString.startsWith('Bearer ')) {
    token = authorizationString.substring(7);
  }
  authAdmin.auth().verifyIdToken(token)
  .then(payload => {
    req.payload = payload;
    next();
  })
  .catch(e => {
    console.error(e);
    console.log('Token passed was ' + token);
    res.status(401).send('Unauthorized');
  });
}

// exports.verifySocketRequest = (socket, next) => {

// }