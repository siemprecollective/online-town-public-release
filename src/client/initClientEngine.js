import querystring from 'query-string';
import axios from 'axios';
import { Lib, Renderer } from 'lance-gg';
import Game from '../common/Game';
import TownClientEngine from './TownClientEngine';
import { getRoomFromPath } from './utils';
const qsOptions = querystring.parse(location.search);

// returns clientEngine
export default async function initClientEngine() {
  const defaults = {
    traceLevel: Lib.Trace.TRACE_NONE,
    scheduler: 'fixed',
    syncOptions: {
      sync: qsOptions.sync || 'frameSync',
      localObjBending: 0,
      remoteObjBending: 0,
      bendingIncrements: 6,
    },
  };

  let gameServerPromise;
  if (window.location.origin.includes('localhost')) {
    gameServerPromise = Promise.resolve({status: 200, data: window.location.origin});
  } else {
    gameServerPromise = axios.post(
      window.location.origin + '/api/getGameServer',
      {
        room: getRoomFromPath(),
      },
    );
  }

  let response = await gameServerPromise;
  
  if (response) {
    if (response.status !== 200) {
      console.error('Could not get game server URL!');
      return null;
    }
    if (response.data) {
      console.log(response.data);
      defaults['serverURL'] = response.data;
    } else {
      console.log('connecting to default localhost');
    }
    let options = Object.assign(defaults, qsOptions);
    let gameEngine = new Game(options);
    let clientEngine = new TownClientEngine(gameEngine, options, Renderer);
    return clientEngine;
  } else {
    console.error('Call to get game server URL failed!');
    return null;
  }
}