class EventProvider {
  constructor(eventNames) {
    this.noValidate = eventNames.length === 0;
    this.eventCallbacks = {};
    eventNames.forEach((name) => {
      this.eventCallbacks[name] = [];
    });
  }

  on(eventName, callback) {
    if (!(eventName in this.eventCallbacks)) {
      if (this.noValidate) {
        this.eventCallbacks[eventName] = [];
      } else {
        throw new Error("No such event!");
      }
    }
    return this.eventCallbacks[eventName].push(callback) - 1;
  }

  remove(eventName, handle) {
    if (handle === undefined) {
      this.eventCallbacks[eventName] = [];
    } else {
      delete this.eventCallbacks[eventName][handle];
    }
  }

  // protected
  fire(eventName, data) {
    if (!(eventName in this.eventCallbacks)) {
      if (this.noValidate) {
        this.eventCallbacks[eventName] = [];
      } else {
        throw new Error("No such event!");
      }
    }
    this.eventCallbacks[eventName].forEach((callback) => {
      callback(data);
    });
  }
}

export default EventProvider;