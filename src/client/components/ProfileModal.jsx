import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import axios from 'axios';

import { auth } from '../constants';
import { isProd, getNameFromRoom, getURLFromRoom } from '../utils';
import { dataOnSignOut } from '../userData';
import './ProfileModal.css';
import { localPreferences } from '../LocalPreferences';

export default function ProfileModal(props) {
  const [showInfo, setShowInfo] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [message, setMessage] = useState({});
  const [signedIn, setSignedIn] = useState(false);
  const [roomsData, setRoomsData] = useState({});
  const [roomList, setRoomList] = useState(false);

  function sendLink() {
    let emailInput = document.getElementById("profile-email-input");
    if (!emailInput || !emailInput.value) {
      console.log(emailInput, emailInput.value);
      return;
    }
    let email = emailInput.value;

    axios.post(window.location.origin + '/api/sendEmailSignIn', {
      email: email,
      origin: window.location.origin
    }).then(() => {
      window.localStorage.setItem("emailForSignIn", email);
      setMessage({"success": "Sent an email to your email address!"});
    }).catch(err => {
      console.error(err);
      setMessage({"error": err.message});
    })
  }

  useEffect(() => {
    return auth.onAuthStateChanged(user => {
      if (user) {
        setSignedIn(true);
      }
    });
  }, []);

  useEffect(() => {
    let rooms = localPreferences.get("rooms");

    const updateRooms = (rooms) => {
      if (rooms) {
        let newRoomsData = {};
        Object.keys(rooms).forEach(roomId => {
          let lastVisit = rooms[roomId]["lastVisited"];
          if (lastVisit) {
            if (typeof(lastVisit) === "string") {
              lastVisit = new Date(lastVisit);
            }
            newRoomsData[roomId] = {
              "name": getNameFromRoom(roomId),
              "lastVisited": lastVisit
            }
          }
        });
        setRoomsData(newRoomsData);
      }
    }
    updateRooms(rooms);

    localPreferences.on("rooms", updateRooms);
    return () => localPreferences.remove("rooms", updateRooms);
  }, []);

  let content;
  if (!showSignIn) {
    let sortedRoomIds = Object.keys(roomsData);
    sortedRoomIds.sort((a, b) => {
      return roomsData[b]["lastVisited"] - roomsData[a]["lastVisited"];
    });
    const convertDateToStr = (date) => {
      const msInDay = 24 * 60 * 60 * 1000;
      let timeMs = (new Date()) - (new Date(date));
      let daysAgo = parseInt(timeMs / msInDay);
      if (daysAgo === 0) {
        return "Today";
      } else if (daysAgo === 1) {
        return "1 day ago";
      }
      return daysAgo + " days ago";
    }
    
    let caret = (
      <>
        {
        roomList ?
          <i className="fas fa-caret-down"></i>
          :
          <i className="fas fa-caret-up"></i>
        }
      </>
    );

    let toggleRooms = (
      <span id="toggle-rooms" className="action" onClick={() => setRoomList(!roomList)}>
        <p>My Rooms  
          {caret}
        </p>
      </span>
    );

    let roomListTitle = (
      <div style={{textAlign: "left", marginTop: "10px", marginBottom: "7px", fontSize: "18px"}}>
        {toggleRooms}
      </div>
    );

    let recentRooms = sortedRoomIds.map(roomId => {
      return (
        <div
          className="recent-room-container action"
          key={roomId}
          onClick={() => window.location.href = getURLFromRoom(roomId)}>
          <div className="recent-room-name">
            {roomsData[roomId]["name"]}
            <div className="recent-room-date">{convertDateToStr(roomsData[roomId]["lastVisited"])}</div>
          </div>
        </div>
      )
    });

    if (sortedRoomIds.length === 0) {
      recentRooms =
        <></>
      roomListTitle =
        <></>
    }

    // let createNewRoom = (
    //   <div className="ot-profile-new-room action" onClick={() => window.open('/private', '_blank')}>
    //     <i className="fas fa-plus ot-homepage-select-icon"></i>
    //     New room
    //   </div>
    // );

    // if (!props.showNewRoom){
    //   createNewRoom = 
    //     <></>
    // }

    let moon = (
      <span onClick={() => {setDarkMode()}}>
        <i className="fas fa-moon" style={{marginLeft: "5px"}}></i>
      </span>
    );

    content =
      <div className="ot-open-profile-modal">
        {
          signedIn ?
            <div className="ot-profile-submit-button">
              <p>
                <span
                  className="action"
                  onClick={() => auth.signOut().then(() => {
                    setSignedIn(false);
                    dataOnSignOut();
                  })}
                >
                  Sign Out
                </span>
              </p>
            </div>
          :
            <div className="ot-profile-submit-button">
              <p>
                <span
                  className="action"
                  onClick={() => setShowSignIn(true)}
                >
                  Login/Register
                </span>
              </p>
            </div>
        }
        { roomListTitle }
        { roomList ?
            recentRooms
            :
            <></>
        }
      </div>
  } else {
    content =
      <div className="ot-create-profile-modal">
        <div
          className="horizontal-container ot-profile-back-button action"
          onClick={() => setShowSignIn(false)}
        >
          <i className="fas fa-arrow-left" style={{marginRight: "10px"}}></i>
          Back
        </div>
        <div className="ot-profile-content">
          To create an account or to sign in, type in your email address.
        </div>
        { showInfo ?
          <div className="ot-profile-content">
            Online Town stores user info on your computer rather than on our
            servers. This means you lose your room history and preferences when you clear
            browser data or switch computers.
          </div>
        : 
          <div
            className="bold action ot-profile-content"
            onClick={() => setShowInfo(true)}>
            Why should I create an account?
          </div>
        }
        <input
          id="profile-email-input"
          placeholder="email@address.com"></input>
          { message.success ?
            <div className="green" style={{marginTop: '10px'}}>{message.success}</div>
          : (message.error ?
              <div className="red" style={{marginTop: '10px'}}>{message.error}</div>
            : null)
          }
        <button
          className="ot-profile-submit-button action"
          onClick={() => sendLink()}>Submit</button>
      </div>;
  }

  return (
    <div id="profile-modal" className={classNames({ "ot-profile-modal": true})}>
      {content}
    </div>
  );
}