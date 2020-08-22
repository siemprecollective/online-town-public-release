import axios from 'axios';
import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import https from 'https';
import fs from 'fs';
import { db, auth } from './server/constants';

import mailgun from 'mailgun-js';
const DOMAIN = 'BLANK';
const mg = mailgun({
  apiKey: 'BLANK',
  domain: DOMAIN
});

import setupGameServer from './game-server'

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, '../dist/index.html');

// A map of number of players that joined each game server. Ideally you also
// get the count of when they've left, but that's for later
// Ideally we don't have both "PROD" and "STAGING" env variables
let GAME_SERVERS;
if (process.env.STAGING === "true") {
  GAME_SERVERS = {
    "BLANK": 0
  }
} else {
  GAME_SERVERS = {
    "BLANK": 0,
    "BLANK": 0,
    "BLANK": 0,
    "BLANK": 0,
    "BLANK": 0,
    "BLANK": 0,
    "BLANK": 0,
    "BLANK": 0,
  }
}

// define routes and socket
const server = express();

// parse application/json
server.use(bodyParser.json());

server.get('/', function (req, res) { res.sendFile(INDEX); });
server.use('/', express.static(path.join(__dirname, '../dist/')));

server.get('/help', (req, res) => res.sendFile(INDEX));
server.get('/private', (req, res) => res.sendFile(INDEX));
server.get('/auth', (req, res) => res.sendFile(INDEX));

server.get('^/:roomNum([a-zA-Z0-9]{8,})/:roomName', (req, res) => {
  let roomId = req.params.roomNum + "\\" + req.params.roomName;
  console.log("got roomId", roomId);
  db.collection("rooms").doc(roomId).get()
    .then(doc => {
      if (doc.exists) {
        res.sendFile(INDEX);
      } else {
        res.status(404).send('No room found of this ID');
      }
    });
});

/*
// Not added back in yet
server.get('^/pub/:roomName', (req, res) => {
  let roomId = "pub\\" + req.params.roomName + "1";
  console.log("got roomid", roomId);
  db.collection("rooms").doc(roomId).get()
    .then(doc => {
      if (doc.exists) {
        res.sendFile(INDEX);
      } else {
        res.status(404).send("No room found of this ID");
      }
    })
});
*/

server.post('/api/getGameServer', (req, res) => {
  console.log("getGameServer")
  if (!req.body.room) {
    res.status(400).send("one of the request parameters is wrong");
    return;
  }

  let roomFirebase = req.body.room.replace("/", "\\");
  db.collection("rooms").doc(roomFirebase).get().then((doc) => {
    if (!doc.exists) throw Exception;
    console.log(doc.data())
    if (doc.data()["serverURL"]) {
      res.status(200).send(doc.data()["serverURL"]);
    } else {
      let server;
      let curNum = -1;
      Object.keys(GAME_SERVERS).forEach(gameServer => {
        if (curNum === -1) {
          server = gameServer;
          curNum = GAME_SERVERS[gameServer];
        } else {
          if (GAME_SERVERS[gameServer] < curNum) {
            server = gameServer;
            curNum = GAME_SERVERS[gameServer];
          }
        }
      });

      GAME_SERVERS[server]++;
      res.status(200).send(server);

      db.collection("rooms").doc(roomFirebase).update({
        "serverURL": server,
      });

      // Doing it after so this call isn't blocked on updating the counts
      Object.keys(GAME_SERVERS).forEach(gameServer => {
        let urlSplit = gameServer.split(":");
        axios.get("https:" + urlSplit[1] + "/serverInfo").then(jsonData => {
          GAME_SERVERS[gameServer] = JSON.parse(jsonData)["numPlayers"];
        })
      })
    }
  }).catch((err) => {
    console.log(err);
    res.status(400).send("room doesn't exist");
  });
});

server.post('/api/addId', (req, res) => {
  if (!req.body.id) {
    res.status(400).send("one of the request parameters is wrong");
    return;
  }
  db.collection("users").doc(req.body.id).set({ overAge: false, analytics: false });
});

server.post('/api/setAge', (req, res) => {
  if (!req.body.id) {
    res.status(400).send("one of the request parameters is wrong");
    return;
  }
  db.collection("users").doc(req.body.id).update({ overAge: true });
});

server.post('/api/setAnalytics', (req, res) => {
  if (!req.body.id) {
    res.status(400).send("one of the request params is wrong");
    return;
  }
  db.collection("users").doc(req.body.id).update({ analytics: true });
});

server.post('/api/sendEmailSignIn', (req, res) => {
  if (!req.body.email || !req.body.origin) {
    res.status(400).send("one of the request params is missing!");
    console.error("sendEmailSignIn request params missing");
    return;
  }

  let actionCodeSettings = {
    url: req.body.origin + '/auth',
    handleCodeInApp: true,
  };

  auth.generateSignInWithEmailLink(req.body.email, actionCodeSettings)
    .then(link => {
      let html = '<html>' +
        'Hey, <br><br>' +
        'We received a request to sign in to Online Town using this email address. <br><br>' +
        '<a href="' + link + '">Sign in to Online Town</a> <br><br>' +
        'If this was not you, please ignore this email.<br><br>' +
        'Thanks,<br>' +
        'The Online Town Team';

      const emailData = {
        from: 'BLANK',
        to: req.body.email,
        subject: 'Sign in to Online Town',
        html: html,
        "o:tracking": 'False'
      }

      mg.messages().send(emailData);
      res.status(200).send();
    })
    .catch(err => {
      console.error(err);
      res.status(400).send(err);
    });
})

server.post('/api/sendFeedback', (req, res) => {
  console.log('/api/sendFeedback');
  if (!req.body.feedback) {
    res.status(400).send("one of the request params is missing");
    return;
  }
  db.collection("feedback").doc().set({
    time: new Date(JSON.parse(req.body.time)),
    feedback: req.body.feedback,
    name: req.body.name,
    email: req.body.email
  });
  res.status(200).send();
});

server.post('/api/sendReport', (req, res) => {
  db.collection("abuse").doc().set({
    time: new Date(JSON.parse(req.body.time)),
    name: req.body.name,
    email: req.body.email,
    site: req.body.site,
    message: req.body.message
  });
  res.status(200).send();
});


server.get('/api/hasPassword', (req, res) => {
  console.log('/api/hasPassword', req.query.roomId);
  console.log(req.query);
  if (!req.query.roomId) {
    res.status(400).send('One of the request parameters is wrong');
    return;
  }

  db.collection("rooms").doc(req.query.roomId).get()
    .then(doc => {
      if (doc.exists) {
        let password = doc.data()["password"];
        if (password) {
          res.status(200).send("true");
        } else {
          res.status(200).send("false");
        }
      } else {
        res.status(200).send("false");
      }
    })
    .catch(err => {
      console.log(err);
    });
});

server.get('/api/hasAccess', (req, res) => {
  if (!req.query.roomId || !req.query.authToken) {
    res.status(400).send('One of the request parameters is wrong');
    return;
  }

  auth.verifyIdToken(req.query.authToken)
    .then(decodedToken => {
      return db.collection("rooms").doc(req.query.roomId)
        .collection("users").doc(decodedToken.uid).get();
    })
    .then(userDoc => {
      if (userDoc.exists && userDoc.data()["hasAccess"]) {
        res.status(200).send("true");
      } else {
        res.status(200).send("false");
      }
    })
    .catch(err => {
      console.error("hasAccess", err);
      res.status(200).send("false");
    })

});

server.post('/api/submitPassword', (req, res) => {
  console.log('/api/submitPassword', req.body.roomId, req.body.authUser);
  if (!req.body.roomId || !req.body.password) {
    res.status(400).send('One of the request parameters is wrong');
    return;
  }

  db.collection("rooms").doc(req.body.roomId).get()
    .then(doc => {
      if (doc.exists) {
        if ("password" in doc.data() && bcrypt.compareSync(req.body.password, doc.data()["password"])) {
          res.status(200).send('passwords match');
          if (req.body.authUser) {
            db.collection("rooms").doc(req.body.roomId).collection("users").doc(req.body.authUser).set({
              hasAccess: true,
            }, { merge: true });
          }
          return;
        }
      }
      res.status(401).send("passwords don't match");
    })
    .catch(err => {
      console.log(err);
    });
});

server.post('/api/createRoom', (req, res) => {
  console.log('/api/createRoom', req.body.name, req.body.map);
  if (!req.body.name || !req.body.map) {
    res.status(400).send('One of the request parameters is wrong');
    return;
  }

  db.collection("rooms").doc(req.body.name).get()
    .then(doc => {
      if (doc.exists) {
        res.status(409).send('Room with that ID already exists');
        throw new Error('break');
      } else {
        let data = {};
        data["map"] = req.body.map;

        let splitName = req.body.name.split("\\");
        data["name"] = splitName[splitName.length - 1];

        if (req.body.password) {
          data["password"] = bcrypt.hashSync(req.body.password, 10);
        }
        if (req.body.modPassword) {
          data["modPassword"] = bcrypt.hashSync(req.body.modPassword, 10);
        }
        return db.collection("rooms").doc(req.body.name).set(data);
      }
    })
    .then(() => {
      res.status(201).send('Sucessfully created room');
    })
    .catch((err) => {
      if (err !== "break") console.log(err);
    });
});

server.post('/api/publicRoomInfo', (req, res) => {
  let roomFirebase = req.body.room.replace("/", "\\");
  if (!roomFirebase.startsWith("pub")) {
    return res.status(400).send();
  }
  db.collection("rooms").doc(roomFirebase).get().then((doc) => {
    if (doc.exists) {
      res.status(200).send({
        closed: doc.data()["closed"],
        closedMessage: doc.data()["closedMessage"],
        openMessage: doc.data()["openMessage"],
        welcomeMessage: doc.data()["welcomeMessage"],
        hasPassword: !!(doc.data()["password"]),
      });
    } else {
      return res.status(400).send();
    }
  }).catch(() => {
    res.status(400).send();
  });
})

if (process.env.PROD === "true") {
  // run only http server
  let credentials = {
    cert: fs.readFileSync('BLANK'),
    key: fs.readFileSync('BLANK'),
  };

  console.log("Running prod https server");
  let httpsServer = https.createServer(credentials, server);
  httpsServer.listen(PORT);
} else {
  // run http server and game server
  console.log("Running dev http and game server");
  let requestHandler = server.listen(PORT, () => console.log(`Listening on ${PORT}`));
  setupGameServer(server, requestHandler);
}
