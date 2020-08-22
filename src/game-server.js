import express from 'express';
import socketIO from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';

import https from 'https';
import fs from 'fs';
import { Lib } from 'lance-gg';
import Game from './common/Game';
import TownServerEngine from './server/TownServerEngine';

export default function setupGameServer(server, httpServer) {
  // Game Instances
  let io = socketIO(httpServer);
  const gameEngine = new Game({ traceLevel: Lib.Trace.TRACE_NONE });
  const serverEngine = new TownServerEngine(io, gameEngine, { debug: {}, updateRate: 6, timeoutInterval: 0 });

  // start the game
  serverEngine.start();

  // parse json
  server.use(bodyParser.json());

  // server stats
  server.get('/serverInfo', (req, res) => {
    serverEngine.gameStatus().then(gameStatus => {
      res.json(gameStatus);
    });
  })

  // moderation tools
  server.post('/checkModPassword', (req, res) => {
    serverEngine.checkModPassword(req.body.room, req.body.password).then((banned) => {
      res.status(200).send(banned);
    }).catch(() => {
      res.status(400).send();
    });
  });
  server.post('/banPlayer', (req, res) => {
    serverEngine.banPlayer(req.body.room, req.body.password, req.body.player).then((banned) => {
      res.status(200).send(banned);
    }).catch(() => {
      res.status(400).send();
    });
  });
  server.post('/unbanPlayer', (req, res) => {
    serverEngine.unbanPlayer(req.body.room, req.body.password, req.body.player).then((banned) => {
      res.status(200).send(banned);
    }).catch(() => {
      res.status(400).send();
    });
  })
  server.post('/setRoomClosed', (req, res) => {
    serverEngine.setRoomClosed(req.body.room, req.body.password, req.body.closed).then(() => {
      res.status(200).send();
    }).catch(() => {
      res.status(400).send();
    });
  })
  server.post('/changeModPassword', (req, res) => {
    serverEngine.changeModPassword(req.body.room, req.body.password, req.body.newPassword).then(() => {
      res.status(200).send();
    }).catch(() => {
      res.status(400).send();
    });
  })
  server.post('/changePassword', (req, res) => {
    serverEngine.changePassword(req.body.room, req.body.password, req.body.newPassword).then(() => {
      res.status(200).send();
    }).catch(() => {
      res.status(400).send();
    });
  })
  server.post('/setModMessage', (req, res) => {
    serverEngine.setModMessage(req.body.room, req.body.password, req.body.message).then(() => {
      
    })
  })
}

// If this file is invoked directly
// Meant to run on the prod servers
if (require.main === module) {
  const PORT = process.env.port || 4000;
  let credentials = {
    cert: fs.readFileSync('BLANK'),
    key: fs.readFileSync('BLANK'),
  };

  console.log("Running prod https server");
  const server = express();
  let httpsServer = https.createServer(credentials, server);
  httpsServer.listen(PORT);
  server.use(cors());
  server.options('*', cors())
  setupGameServer(server, httpsServer);
}