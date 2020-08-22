import React, { useEffect, useState, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import axios from 'axios';

import './index.html';

import './reset.css';
import './fonts.css';
import './main.css';

import { auth } from './constants';
import { dataOnSignIn } from './userData';
import { localPreferences } from './LocalPreferences';
import { amplitudeInstance } from './amplitude';
import { makeId, getSubDomain } from './utils';
import { readCookie, createCookie } from './cookies';
import CreatePrivate from './components/CreatePrivate.jsx';
import PrivateRoom from './components/PrivateRoom.jsx';
import Homepage from './components/Homepage.jsx';
import Help from './components/Help.jsx';
import EmailAuth from './components/EmailAuth.jsx';

// Add user cookie
let userStorage = localPreferences.get('user');
if (!userStorage) {
  let newId = makeId(20);
  let data = {id: newId, overAge: false, analytics: false, seenTutorial: false};
  localPreferences.set('user', data);
  axios.post(window.location.origin + '/api/addId', {
    id: newId,
  });

  amplitudeInstance.setUserId(newId);
}

// Add subdomain cookie
if (getSubDomain()) {
  let toWrite = readCookie('publicRooms');
  if (toWrite && !toWrite.includes(getSubDomain())) {
    toWrite = toWrite + ',' + getSubDomain();
    createCookie('publicRooms', toWrite, 3000);
  } else if (!toWrite) {
    createCookie('publicRooms', getSubDomain(), 3000);
  }
}



let App = () => {
  useEffect(() => {
    return auth.onAuthStateChanged(user => {
      if (user) {
        dataOnSignIn();
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <Switch>
        <Route path='/' exact component={Homepage} />
        <Route path="/help" exact component={Help} />
        <Route path="/private" exact component={CreatePrivate} />
        <Route path="/auth" component={EmailAuth} />
        <Route path="/:room/:name" component={PrivateRoom} />
      </Switch>
    </BrowserRouter>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
