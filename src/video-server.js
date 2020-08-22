var WebSocket = require('ws');
var https = require('https');
var fs = require('fs');

const server = https.createServer({
  cert: fs.readFileSync('BLANK'),
  key: fs.readFileSync('BLANK'),
});

const wss = new WebSocket.Server({ server });

id_to_socket = {};
pending_handshake = {};

wss.on('connection', client => {
  console.log('connected client');
  client.on('close', () => {
    console.log("closing", client.room, client.id);
    if (client.room in id_to_socket && client.id in id_to_socket[client.room]) {
      delete id_to_socket[client.room][client.id];
    }
    if (client.room in pending_handshake && client.id in pending_handshake[client.room]) {
      delete pending_handshake[client.room][client.id];
    }
  });
  client.on('message', payload => {
    dec = JSON.parse(payload);
    evt = dec.event;
    data = dec.data;
    room = dec.room;

    if (!(room in id_to_socket)) {
      id_to_socket[room] = {};
      pending_handshake[room] = {};
    }

    if (evt === 'identify') {
      console.log('identify room: ', room, ' id: ', data);
      client.room = room;
      client.id = data;
      id_to_socket[room][data] = client;
      for (var userId in id_to_socket[room]) {
        if (userId !== data) {
          let payload = JSON.stringify({
            event: 'connect',
            id: userId,
            room: room
          });
          id_to_socket[room][data].send(payload);
        }
      }
      if (data in pending_handshake[room]) {
        pending_handshake[room][data].forEach(payload => {
          console.log('sending pending handshake');
          id_to_socket[room][data].send(payload);
        })
      }
    } else if (evt === 'handshake') {
      console.log('handshake message room: ', room);
      let to = dec.to;
      let from = dec.from;
      let payload = JSON.stringify({
        event: evt,
        data: data,
        from: from,
        room: room
      })
      if (to in id_to_socket[room]) {
        console.log('sending to: ', to);
        id_to_socket[room][to].send(payload);
      } else {
        console.log('couldnt find ', to, 'putting in pending handshake');
        if (to in pending_handshake[room]) {
          pending_handshake[room][to].push(payload);
        } else {
          pending_handshake[room][to] = [payload];
        }
      }
    }
  })
})

if (process.env.PROD === "true") {
  console.log("PROD, running on port 9008");
  server.listen(9008);
} else {
  console.log("DEV, running on port 9009");
  server.listen(9009);
}