import EventProvider from '../common/EventProvider.js';

class LocalPreferences extends EventProvider {
  constructor() {
    super([]);
  }

  setDefault(key, value) {
    if (window.localStorage[key] === undefined) {
      window.localStorage[key] = value;
    }
  }

  set(key, value) {
    window.localStorage[key] = JSON.stringify(value);
    this.fire(key, value);
  }

  get(key) {
    if (window.localStorage[key] === undefined) {
      return undefined;
    }
    try {
      return JSON.parse(window.localStorage[key]);
    } catch (err) {
      return null;
    }
  }
}

let localPreferences = new LocalPreferences();

export {localPreferences} ;