import React from 'react';

const ModContext = React.createContext({
  modPasswordCorrect: false,
  banned: [],
  result: {},
  setModPassword: () => {},
  checkModPassword: () => {},
  banPlayer: () => {},
  unbanPlayer: () => {},
  setRoomClosed: () => {},
  changeModPassword: () => {},
  changePassword: () => {},
  setModMessage: () => {},
})

export default ModContext;