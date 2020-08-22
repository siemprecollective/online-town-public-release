export function getNearbyTeleportSquare(player, players, map) {
  let seen = {};
  const DISTANCE = 5;

  function getValidNeighbors(x, y, seen) {
    return [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]
      .filter(([nx, ny]) => {
        return (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length
        && map[ny][nx] !== 1 && map[ny][nx] < 100
        && !seen[nx + " " + ny]);
      });
  }

  // x, y, and distance
  let processQueue = [[player.position.x, player.position.y, 0]];
  seen[player.position.x + " " + player.position.y] = true;
  while (processQueue.length > 0) {
    let [x, y, distance] = processQueue.pop();
    if (distance >= DISTANCE) {
      let collidesPlayer = false;
      players.forEach(player => {
        if (player.position.x === x && player.position.y === y) {
          collidesPlayer = true;
        }
      });
      if (!collidesPlayer) {
        return [x, y];
      }
    }

    const validNeighbors = getValidNeighbors(x, y, seen);
    validNeighbors.forEach(([nx, ny]) => {
      processQueue.push([nx, ny, distance + 1]);
      seen[nx + " " + ny] = true;
    });
  }

  return null;
}

function hasBlock(x, y, players, map) {
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) {
    return true;
  }
  if (map[y][x] === 1 || map[y][x] >= 100) {
    return true;
  }
  for (let i = 0; i < players.length; i++) {
    if (players[i].position.x === x && players[i].position.y === y) {
      return true;
    }
  }
  return false;
}

export function isBlocked(x, y, players, map) {
  return hasBlock(x - 1, y, players, map)
    && hasBlock(x + 1, y, players, map)
    && hasBlock(x, y - 1, players, map)
    && hasBlock(x, y + 1, players, map);
}

export function getPlayerDistance(myPlayer, player) {
  if (myPlayer != null && player != null) {
    let xs = myPlayer.position.x - player.position.x;
    let ys = myPlayer.position.y - player.position.y;
    xs *= xs;
    ys *= ys;
    return {[player.playerId]: Math.sqrt(xs + ys)};
  }
  return null;
}