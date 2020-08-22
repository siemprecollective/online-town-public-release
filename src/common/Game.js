import { GameEngine } from 'lance-gg';
import {
  directionMap,
  SPEED,
  MODIFIER,
  STEP_INTERVAL,
  TELEPORT_INTERVAL
} from './constants';
import { collisionMap, portalDirectionMap } from './maps';
import { isBlocked, getNearbyTeleportSquare } from './utils';
import { Player } from './gameObjects';

import { setShowName } from '../client/drawCanvas';

// /////////////////////////////////////////////////////////
//
// GAME ENGINE
//
// /////////////////////////////////////////////////////////
export default class Game extends GameEngine {

  constructor(options) {
    super(options);
    this.ignoreInputs = true;

    // common code
    this.on('postStep', this.gameLogic.bind(this));

    this.traceLevel = 0;
    this.videosInitialized = false;
    this.lastStep = {};
    this.lastTeleport = 0;
  }

  filterPlayerFunc(myPlayerId) {
    let myPlayer = this.world.queryObject({ myPlayerId });
    if (myPlayer === null) {
      return (player) => false;
    }

    return (player) => {
      return player.currentMap === myPlayer.currentMap;
    };
  }

  registerClasses(serializer) {
    serializer.registerClass(Player);
  }

  gameLogic() {
  }

  processInput(inputData, playerId) {
    super.processInput(inputData, playerId);

    if (this.lastStep[playerId] && inputData.step - this.lastStep[playerId] < STEP_INTERVAL) {
      return;
    }
    this.lastStep[playerId] = inputData.step;
    
    let player = this.world.queryObject({ playerId });
    if (player) {
      let players = this.world.queryObjects({ instanceType: Player });
      players = players.filter((tempPlayer) => {
        return player.currentMap === tempPlayer.currentMap && player._roomName === tempPlayer._roomName;
      });
      function validMove(player, x, y) {
        // Collides with player
        for (let i = 0; i < players.length; i++) {
          if (x === players[i].position.x && y === players[i].position.y) return false;
        }

        // Out of bounds of map
        // x and y are switched, because lance x and y are horizontal and vertical
        if (y < 0 || y >= collisionMap[player.currentMap].length) return false;
        if (x < 0 || x >= collisionMap[player.currentMap][0].length) return false;

        // Hits a boundary
        if (collisionMap[player.currentMap][y][x] === 1) return false;
        return true;
      }
    
      let newX = player.position.x;
      let newY = player.position.y;

      switch(inputData.input) {
        case "left":
          newX = player.position.x - SPEED / MODIFIER;
          if(player.currentDirection == directionMap["left-1"]) {
            player.currentDirection = directionMap["left-2"];
          } else if(player.currentDirection == directionMap["left-2"]) {
            player.currentDirection = directionMap["left-1"];
          } else {
            player.currentDirection = directionMap["left-1"];
          }
          break;
        case "right":
          newX = player.position.x + SPEED / MODIFIER;
          if(player.currentDirection == directionMap["right-1"]) {
            player.currentDirection = directionMap["right-2"];
          } else if(player.currentDirection == directionMap["right-2"]) {
            player.currentDirection = directionMap["right-1"];
          } else {
            player.currentDirection = directionMap["right-1"];
          }
          break;
        case "up":
          newY = player.position.y - SPEED / MODIFIER;
          if(player.currentDirection == directionMap["up-1"]) {
            player.currentDirection = directionMap["up-2"];
          } else if(player.currentDirection == directionMap["up-2"]) {
            player.currentDirection = directionMap["up-1"];
          } else {
            player.currentDirection = directionMap["up-1"];
          }

          break;
        case "down":
          newY = player.position.y + SPEED / MODIFIER;
          if(player.currentDirection == directionMap["down-1"]) {
            player.currentDirection = directionMap["down-2"];
          } else if(player.currentDirection == directionMap["down-2"]) {
            player.currentDirection = directionMap["down-1"];
          } else {
            player.currentDirection = directionMap["down-1"];
          }

          break;
        case "space":
          if (isBlocked(player.position.x, player.position.y, players, collisionMap[player.currentMap])) {
            console.log("is blocked");
            let newCoors = getNearbyTeleportSquare(player, players, collisionMap[player.currentMap]);
            console.log("new Coors", newCoors);
            if (newCoors) {
              newX = newCoors[0];
              newY = newCoors[1];
            }
          }
          break;
      }

      if (validMove(player, newX, newY)) {
        player.position.x = newX;
        player.position.y = newY;
      }

      let endingVal = collisionMap[player.currentMap][player.position.y][player.position.x]
      // Check if portal
      if (endingVal >= 100 && (inputData.step - this.lastTeleport) > TELEPORT_INTERVAL) {
        let temp = (endingVal + "").split(".")
        let newMap = parseInt(temp[0]);
        let portalId = parseInt(temp[1]);
        if (portalDirectionMap[player.currentMap][portalId] === "up" && (player.currentDirection === directionMap["up-1"] || player.currentDirection === directionMap["up-2"])
          || portalDirectionMap[player.currentMap][portalId] === "right" && (player.currentDirection === directionMap["right-1"] || player.currentDirection === directionMap["right-2"])
          || portalDirectionMap[player.currentMap][portalId] === "down" && (player.currentDirection === directionMap["down-1"] || player.currentDirection === directionMap["down-2"])
          || portalDirectionMap[player.currentMap][portalId] === "left" && (player.currentDirection === directionMap["left-1"] || player.currentDirection === directionMap["left-2"])) {
            let portalX = null, portalY = null;
            collisionMap[newMap].forEach((row, idxY) => {
              row.forEach((element, idxX) => {
                if (element === parseFloat(player.currentMap + "." + portalId)) {
                  portalX = idxX;
                  portalY = idxY;
                }
              })
            })
 
            let oppositeMap = {
              "up": 1,
              "right": 5,
              "down": 3,
              "left": 7
            };
            if (portalX !== null && portalY !== null) {
              player.position.x = portalX;
              player.position.y = portalY;
              player.currentDirection = oppositeMap[portalDirectionMap[newMap][portalId]];
              player.currentMap = newMap;
              this.lastTeleport = inputData.step;
            }
        }
      }
    }
  }
}
