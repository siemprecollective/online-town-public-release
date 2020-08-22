import { localPreferences } from './LocalPreferences';
import { isProd } from './utils';

// Doing this because server imports Game.js, which shares client code
// And amplitude doesnt work server side unfortunately

function isServer() {
  return ! (typeof window != 'undefined' && window.document);
}

const amplitude = !isServer() ? require("amplitude-js") : null;

const amplitudeInstance = amplitude ? amplitude.getInstance() : {
  init: () => {},
  logEvent: () => {},
  setUserId: () => {},
  setUserProperties: () => {}
};
const amplitudeAnonInstance = amplitude ? amplitude.getInstance("anon") : {
  init: () => {},
  logEvent: () => {},
  setUserId: () => {},
  setUserProperties: () => {}
};

if (!isServer()) {
  let amplitudeConfig = {
    domain: "BLANK",
    eventUploadPeriodMillis: 3000,
    trackingOptions: {
      city: false,
      country: false,
      dma: false,
      ip_address: false,
      region: false
    }
  }
  
  let userId = null;
  let userStorage = localPreferences.get('user');
  if (userStorage) {
    userId = userStorage.id;
  }
  
  // All events sent by the anon instance must set userId to null and regenerate
  // device ID, to maintain anonymiity
  if (isProd()) {
    // OnlineTown
    amplitudeInstance.init("803c82be2896e464014a3ad8404618ca", userId, amplitudeConfig);
    // OnlineTown-Anon
    amplitudeAnonInstance.init("1923301f34ceb6aa32af6493d51cc614", null, amplitudeConfig);
  } else {
    // OnlineTown-Dev
    amplitudeInstance.init("058d00451316b890b2186a1bfa86f2bf", userId, amplitudeConfig);
    // OnlineTown-Anon-Dev
    amplitudeAnonInstance.init("a4854232d360aa318fc628f3a24a4ba1", null, amplitudeConfig);
  }
}

export { amplitudeInstance, amplitudeAnonInstance };