const express = require('express');
const http = require('http');
const uuid = require('uuid');
const fs = require('fs');
const admin = require('firebase-admin');
const serviceAccount = require('./firstnativeproject-89ad9-firebase-adminsdk-eswdf-8a7582ac7f.json');
const { connect } = require('./connect');
const { getFields, verifyRequest } = require('./utils');

const app = express();
const PORT = process.env.PORT || 8080;
const SOCKETPORT = process.env.SOCKETPORT || 1337;
let db;

const socketServer = http.createServer({
  // key: fs.readFileSync('./server/apache-selfsigned.key'),
  // cert: fs.readFileSync('./server/apache-selfsigned.crt')
}, (req, res) => {});

const io = require('socket.io')(socketServer, { 
  pingInterval: 5000, 
  pingTimeout: 10000,
  transports: ['websocket'],
  cookie: false,
  origins: '*:*',
  serveClient: false,
  handlePreflightRequest: (req, res) => {
    const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": '*',
      "Access-Control-Allow-Credentials": true
    };
    res.writeHead(200, headers);
    res.end();
  }
});

app.use(express.json({ type: 'application/json' }));
app.use(express.urlencoded({ extended: false }));
app.use(verifyRequest);                                           /** [verifyRequest] handles token verification */

const deviceStatusMem = {};
const socketToConfigIdMap = {};

io.on('connection', (socket) => {
  console.log(new Date() + ' Connected to ' + socket.client.id);

  socket.on('change', (configurationId, state) => {
    socketToConfigIdMap[socket.id] = configurationId;
    if (JSON.stringify(state) !== JSON.stringify(deviceStatusMem[configurationId])) {
      console.log(new Date() + ' Changing switch state to ' + JSON.stringify(state));
      let key = `devices.${configurationId}`;
      db.collection('Users')
      .findOneAndUpdate({
        [key]: { $exists: true }
      }, { 
        $set: { [`${key}.state`]: state }
      }, {
        returnOriginal: false
      })
      .then(write => {
        let curState = write.value.devices[configurationId].state;
        deviceStatusMem[configurationId] = curState;
        io.emit('status', configurationId, curState);
      })
    }
    else {
      io.emit('status', configurationId, deviceStatusMem[configurationId]);
    }
  });

  socket.on('status', (configurationId, state) => {
    socketToConfigIdMap[socket.id] = configurationId;
    console.log(new Date() + ' Recieved status from ' + configurationId);
    if (deviceStatusMem[configurationId]) {
      // Check with temporary solution wether switch states are equal
      // and send if they are not equal
      // !!! Clients must make sure to send device state [keys] in order !!!
      if (JSON.stringify(state) !== JSON.stringify(deviceStatusMem[configurationId])) {
        console.log(new Date() + ' Sending correct switch state to ' + configurationId);
        io.emit('status', configurationId, deviceStatusMem[configurationId]);
      }
    } else {
      let key = `devices.${configurationId}`;
      db.collection('Users')
      .findOne({
        [key]: { '$exists': true }
      })
      .then(user => {
        deviceStatusMem[configurationId] = user.devices[configurationId].state;
        if (JSON.stringify(state) !== JSON.stringify(deviceStatusMem[configurationId])) {
          console.log(new Date() + ' Sending correct switch state to ' + configurationId);
          io.emit('status', configurationId, deviceStatusMem[configurationId]);
        }
      })
      .catch(e => {
        console.error(e);
      })
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(new Date() + ' Client ' + socket.id + ' disconnected');
    // To free memory
    delete deviceStatusMem[socketToConfigIdMap[socket.id]];
    delete socketToConfigIdMap[socket.id];
  })
});

app.get('/myDetails',
  (req, res) => {
    let userid = req.payload.uid;
    console.log(new Date() + ' ' + userid + ' has signed in');
    db.collection('Users')
    .findOne({
      _id: userid
    })
    .then(user => {
      const userDetails = getFields(req.payload);
      if (user !== null) {
        return res.send({
          ...user,
          registered: true
        });
      }
      else {
        return res.send({
          ...userDetails,
          registered: false
        });
      }
    })
    .catch(e => {
      console.error(e);
      res.status(500).send('Some error occurred');
    });
  }
);

app.post('/record',
  (req, res) => {
    console.log(new Date() + ' Adding user : ' + JSON.stringify(req.body));
    const {
      _id,
      firstname,
      lastname,
      age,
      gender,
      email,
      phone
    } = req.body;
    db.collection('Users')
    .insertOne({
      _id: _id,
      firstname: firstname,
      lastname: lastname,
      age: age,
      gender: gender,
      email: email,
      phone: phone
    })
    .then(write => {
      console.log(new Date() + ' User ' + _id + ' added successfully');
      res.status(200).send(true);
    })
    .catch(e => {
      console.error(e);
      res.status(500).send('Some error occurred');
    });
  }
);

app.get('/store/getDevices',
  (req, res) => {
    let pageNo = req.query.pageNo;
    const devices = [];
    db.collection('Devices')
    .find({})
    .sort({ 
      name: 1 
    })
    .skip(pageNo ? pageNo * 20 : 0)
    .limit(20)
    .each((err, device) => {
      if (err) {
        console.error(err);
        res.status(500).send('Some error occurred');
      } else if (device) {
        devices.push(device);
      } else {
        console.log(new Date() + ' Fetched ' + devices.length + ' devices');
        res.status(200).send(devices);
      }
    });
  }
);

app.get('/store/device/:device_id', 
  (req, res) => {
    let device_id = req.params.device_id;
    db.collection('Devices')
    .findOne({ 
      _id: device_id 
    })
    .then(device => {
      console.log(new Date() + ' Fetched device having ID: ' + device._id);
      res.status(200).send(device);
    })
    .catch(e => {
      console.error(e);
      res.status(500).send('Some error occurred');
    });
  }
);

app.post('/store/buy',
  (req, res) => {
    let userId = req.payload.uid,
      device = req.body;
    let key = `devices.${uuid.v4()}`;
    db.collection('Users')
    .findOneAndUpdate({
      _id: userId
    }, {
      $set: {
        [key]: {
          ...device,
          state: {
            switch1: false,
            switch2: false,
            switch3: false,
            switch4: false,
            switch5: false,
            switch6: false,
            switch7: false,
            switch8: false,
          }
        }
      }
    }, {
      returnOriginal: false,
      upsert: true
    })
    .then(write => {
      console.log(new Date() + ' Added device ' + device._id + ' to user ' + write.value._id);
      res.status(200).send(write.value);      /// write.value is the updated document
    })
    .catch(e => {
      console.error(e);
      res.status(500).send('Some error occurred');
    })
  }
);

connect(dbInstance => {
  db = dbInstance;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://firstnativeproject-89ad9.firebaseio.com"
  });
  app.listen(PORT);

  socketServer.listen(SOCKETPORT);
});
