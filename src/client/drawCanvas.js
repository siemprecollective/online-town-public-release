import { colors, PUBLIC_MAP } from './constants';
import { clamp, max, getSubDomain } from './utils';
import { updateAnim } from './environmentAnimation';
import { isBlocked } from '../common/utils';
import { imageMap, imageDimensionsMap, collisionMap, characterMap } from '../common/maps';
import { characterIds } from './constants';

export var objectSizes = 20;

var lastMap;
var terrainImages = {};
var playerImages = {};

var publicStartX;
var publicStartY;

let playerMap = {}
let playersNameMap = {};

var mouseCoorX = 0;
var mouseCoorY = 0;

var showNames = false;

var directionCoors = [
  { x: 0, y: 0 },
  { x: 17, y: 0 },
  { x: 34, y: 0 },
  { x: 125, y: 0 },
  { x: 143, y: 0 },
  { x: 51, y: 0 },
  { x: 69, y: 0 },
  { x: 160, y: 0 },
  { x: 178, y: 0 },
];

export function drawInit() {
  // TODO: optimization, only load when necessary and not all at once
  let canvas = document.getElementById("canvas");
  canvas.onmousemove = (e) => {
    mouseCoorX = e.clientX - canvas.getBoundingClientRect().x;
    mouseCoorY = e.clientY - canvas.getBoundingClientRect().y;
  }
}


//coordinates to draw bar indicating location of player offscreen

function offScreenLine(x, y) {

  var offset = 2;
  var radius = 8;

  var a1 = (Math.atan2(-200, 300) + (2 * Math.PI)) % (2 * Math.PI); //top right
  var a2 = (Math.atan2(200, 300) + (2 * Math.PI)) % (2 * Math.PI); //bottom right
  var a3 = (Math.atan2(200, -300) + (2 * Math.PI)) % (2 * Math.PI); //bottom left
  var a4 = (Math.atan2(-200, -300) + (2 * Math.PI)) % (2 * Math.PI); //top left

  var angle = (Math.atan2((y - 200), (x - 300)) + (2 * Math.PI)) % (2 * Math.PI);

  if ((a2 <= angle) && (angle < a3)) { //bottom wall
    var new_x1 = 300 + (200 * Math.tan((0.5 * Math.PI) - angle)) - radius;
    var new_y1 = -offset + 400;
    var new_x2 = new_x1 + (2 * radius);
    var new_y2 = new_y1;
  }
  else if ((a3 <= angle) && (angle < a4)) { //left wall
    var new_x1 = offset;
    var new_y1 = 200 + (-300 * Math.tan(angle)) - radius;
    var new_x2 = new_x1;
    var new_y2 = new_y1 + (2 * radius);
  }
  else if ((a4 <= angle) && (angle < a1)) { //top wall
    var new_x1 = 300 + (-200 * Math.tan((0.5 * Math.PI) - angle)) - radius;
    var new_y1 = offset;
    var new_x2 = new_x1 + (2 * radius);
    var new_y2 = new_y1;
  }
  else { //right wall
    var new_x1 = -offset + 600;
    var new_y1 = 200 + (300 * Math.tan(angle)) - radius;
    var new_x2 = new_x1;
    var new_y2 = new_y1 + (2 * radius);
  }
  return [new_x1, new_y1, new_x2, new_y2];
}


function draw(x, y, map, players) {
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var w = document.getElementById("canvas").offsetWidth;
  var h = document.getElementById("canvas").offsetHeight;

  let top_x = x * objectSizes + (objectSizes / 2) - (w / 2);
  let top_y = y * objectSizes + (objectSizes / 2) - (h / 2);
  top_x = clamp(top_x, 0, max(0, imageDimensionsMap[map][0] - w - 1));
  top_y = clamp(top_y, 0, max(0, imageDimensionsMap[map][1] - h - 1));

  if (map !== lastMap) {
    lastMap = map;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
  }

  if (!(map in terrainImages)) {
    terrainImages[map] = new Image;
    terrainImages[map].src = imageMap[map];
  }

  ctx.drawImage(
    terrainImages[map],
    top_x, top_y, w, h,
    0, 0, w, h);

  ctx.beginPath();
  ctx.lineWidth = "4";
  ctx.strokeStyle = "white";
  ctx.rect(
    2,
    2,
    596,
    396
  );
  ctx.stroke();
  ctx.closePath();

  updateAnim(map, ctx, top_x, top_y, objectSizes);

  if (!(map in playerImages)) {
    if (map in characterMap) {
      characterMap[map].forEach(characterId => {
        playerImages[characterId] = new Image();
        playerImages[characterId].src = characterIds[characterId];
      });
    } else {
      playerImages[1] = new Image();
      playerImages[1].src = "/images/characters/player.png";
    }
  }

  // TODO fix this
  let mapNames = document.getElementsByClassName("map-name-container")
  for (let mapNameContainer of mapNames) {
    mapNameContainer.hidden = true;
  }
  players.forEach(player => {
    let direction = directionCoors[player.currentDirection];

    let drawX = player.position.x * objectSizes - top_x;
    let drawY = player.position.y * objectSizes - top_y;

    if (drawX >= 0 && drawX < w && drawY >= 0 && drawY < h) {
      ctx.drawImage(
        playerImages[player.characterId],
        direction.x,
        direction.y,
        objectSizes - 2,
        objectSizes,
        drawX,
        drawY,
        objectSizes,
        objectSizes
      );

      ctx.beginPath();
      ctx.lineWidth = "2";
      ctx.strokeStyle = colors[player.playerId % colors.length];
      ctx.rect(
        drawX,
        drawY,
        objectSizes,
        objectSizes
      );
      ctx.stroke();

      let mapNameContainer = document.getElementById("map-name-container-" + player.playerId)
      let mousedOver =
        mouseCoorX >= drawX
        && mouseCoorX <= drawX + objectSizes
        && mouseCoorY >= drawY && mouseCoorY <= drawY + objectSizes;
      if (
        (showNames || mousedOver)
        && playersNameMap[player.playerId] && mapNameContainer
      ) {
        // Draw the name
        mapNameContainer.style.left = drawX + (objectSizes / 2) + "px";
        mapNameContainer.style.top = drawY + objectSizes + "px";
        mapNameContainer.style.border = "solid 2px " + colors[player.playerId % colors.length];
        mapNameContainer.style.transform = "translateX(-50%)";
        mapNameContainer.textContent = playersNameMap[player.playerId];
        mapNameContainer.hidden = false;
      } else if (mapNameContainer) {
        mapNameContainer.hidden = true;
      }
    }
    else {
      if (!window.selectedIds || window.selectedIds[player.playerId]) {
        var position = offScreenLine(drawX + 10, drawY + 10);
        ctx.beginPath();
        ctx.lineWidth = "4";
        ctx.strokeStyle = colors[player.playerId % colors.length];
        ctx.moveTo(position[0], position[1]);
        ctx.lineTo(position[2], position[3]);
        ctx.stroke();
        ctx.closePath();
      }
    }
  });

  let blockedText = document.getElementById("blocked-text");
  if (blockedText) {
    blockedText.hidden = !isBlocked(x, y, players, collisionMap[map]);
  }
}

export function setShowNames(newShowNames) {
  if (newShowNames === undefined) {
    showNames = !showNames;
  } else {
    showNames = newShowNames;
  }
}

export function updatePlayerMap(newPlayerMap) {
  playerMap = newPlayerMap;
}

export function update(myPlayer, players) {
  if (!myPlayer) {
    return;
  }
  players.forEach(player => {
    let name = "";
    if (playerMap && player.playerId in playerMap && "name" in playerMap[player.playerId]) {
      name = playerMap[player.playerId]["name"];
    }
    playersNameMap[player.playerId] = name;
  })
  draw(myPlayer.position.x, myPlayer.position.y, myPlayer.currentMap, players);
}

export function publicUpdate(players) {
  if (!publicStartX || !publicStartY) {
    collisionMap[PUBLIC_MAP[getSubDomain()]].forEach((row, idxY) => {
      row.forEach((element, idxX) => {
        if (element === -1) {
          publicStartX = idxX;
          publicStartY = idxY;
        }
      });
    });
  }
  draw(publicStartX, publicStartY, PUBLIC_MAP[getSubDomain()], players);
}
