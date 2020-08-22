import React, { useState } from 'react';
import classNames from 'classnames';

import axios from 'axios';

import Feedback from './Feedback.jsx';
import GameHeader from './GameHeader.jsx';

import './CreatePrivate.css';

const Logo = '/images/site/logo.png';
const Return = '/images/site/return.png';
const PreviewApartment = '/images/maps/preview/preview-apartment.png';
const PreviewConference = '/images/maps/preview/preview-conference.png';
const PreviewOffice = '/images/maps/preview/preview-office.png';
const PreviewBlackChairs = '/images/maps/preview/preview-black_chairs.png';
const PreviewDolores = '/images/maps/preview/preview-dolores.png';
const PreviewTimesSquare = '/images/maps/preview/preview-times_square.png';
const PreviewGolden = '/images/maps/preview/preview-golden.png';

import { makeId, getSubDomain } from '../utils.js';
import { amplitudeAnonInstance } from "../amplitude";

const CreatePrivateForm = () => {
  let [showNewRoom, setShowNewRoom] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  let [name, setName] = useState("");
  let [password, setPassword] = useState("");
  let [modPassword, setModPassword] = useState("");
  let [map, setMap] = useState(0);

  let [error, setError] = useState(null);

  // TODO this should be server assigned
  let [randomId, _] = useState(makeId(16));

  const submitForm = () => {
    if (map === 0) {
      setError("Cannot create room: no map selected");
      return;
    }
    if (name === "") {
      setError("Cannot create room: room name is blank");
      return;
    }

    let roomName = randomId + "\\" + name;
    axios.post(window.location.origin + '/api/createRoom', {
      name: roomName,
      password: password,
      modPassword: modPassword,
      map: map
    })
      .then((response) => {
        console.log('responded with ', response.status, ' ', response.statusText);
        if (response.status === 201) {
          amplitudeAnonInstance.logEvent('Create Private', {
            'room': roomName,
            'hasPassword': (password !== ""),
            'map': map
          });
          amplitudeAnonInstance.setUserId(null);
          amplitudeAnonInstance.regenerateDeviceId();

          window.location.href = "/" + randomId + "/" + name;
        }
      })
  }

  const mapSelect = (name, image, id) => {
    return (
      <div
        className="vertical-container map-container"
        style={{cursor: (map == id) ? "default" : "pointer"}}
        onClick={() => { setMap(id) }}

      >
        <img
          src={image}
          style={{ borderRadius: "10px", width: "120px"}}
          className={classNames({ "grayscale": map !== id })}
        />
        <div
          style={{ marginTop: "10px" }}
          className={classNames({ "bold": map === id })}>
            <p style={{margin: "0px auto"}}>{name}</p>
        </div>
      </div>
    );
  };

  const customMaps = () => {

    return <></>
  }

  let canSubmit = map !== 0 && name !== "";

  let createRoomDescription = (
    <div style={{ marginTop: "40px", marginBottom: "10px", maxWidth: "424px", lineHeight: "24px" }}>
      <div style={{textAlign: "center"}}>
        <h2>Create your own room</h2>
      </div>
      <p>To create a private room on Online Town, you just need to fill out a few settings. When you’re finished, only the people you share the link and password with can hang out with you in your space. Rooms on Online Town don’t expire and there’s no limit to how many people you can invite or how long you can spend there.</p>
    </div>
  );

  let addRoomName = (
    <div style={{ marginTop: "0px", marginBottom: "20px", maxWidth: "424px", lineHeight: "24px" }}>
      <div
        style={{ position: "relative" }}
        className={classNames({ "space-container": true, "green": name !== "" })}
      >
        {name !== "" ?
          <i className="fas fa-check green checkmark"></i>
          :
          <></>
        }
        <h3>1) Room Name</h3>
      </div>
      <p>All room names welcome here. Just keep in mind that anyone you share the room with will be able to see the room name and it will show up in the URL as well</p>
      <div className="space-container" style={{fontSize: "18px"}}>
        <input
          width="150px"
          maxLength="14"
          pattern="[a-zA-Z0-9_-]{14}"
          autoCapitalize="off"
          autoComplete="off"
          spellCheck="off"
          placeholder="Room name"
          className={classNames({"invalid-field": name == "", "valid-field": name !== ""})}
          onChange={(e) => { setName(e.target.value) }}
        >
        </input>
        </div>
    </div>
  );

  let customMaps_ = customMaps();

  let addEnvironment = (
    <div style={{ marginTop: "20px", maxWidth: "424px", lineHeight: "24px" }}>
      <div
        style={{ position: "relative" }}
        className={classNames({ "space-container": true, "green": map !== 0 })}
      >
        {map !== 0 ?
          <i className="fas fa-check green checkmark"></i>
          :
          <></>
        }
        <h3>2) Environment</h3>
      </div>
      <p>Select a room type:</p>
      <div className="preview-buttons space-container vertical-center-container">
        <div className="horizontal-container" style={{ marginBottom: "30px" }}>
          {mapSelect("Apartment", PreviewApartment, 110)}
          {mapSelect("Ocean Beach", PreviewGolden, 215)}
          {mapSelect("Black Chairs", PreviewBlackChairs, 140)}
          
        </div>
        <div className="horizontal-container" style={{ marginBottom: "10px" }}>
          {mapSelect("Office", PreviewOffice, 120)}
          {mapSelect("Conference", PreviewConference, 130)}
          {mapSelect("Times Square", PreviewTimesSquare, 160)}
        </div>
        {customMaps_}
      </div>
    </div>   
  );

  let addPassword = (
    <div style={{ marginTop: "30px", marginBottom: "20px", maxWidth: "424px", lineHeight: "24px" }}>
      <div
        style={{ position: "relative" }}
        className={classNames({ "space-container": true, "green": password !== "" })}
      >
        {password !== "" ?
          <i className="fas fa-check green checkmark"></i>
          :
          <></>
        }
        <h3>3) Room Password <span style={{color: "gray"}}>(Optional)</span></h3>
      </div>
      <p>Your room URL is protected by a long and random string of characters. We recommend that you consider also adding a password if you want additional security: </p>
        <div className="space-container">
          <input
            type="password"
            style={{ width: "200px" }}
            autoCapitalize="off"
            autoComplete="off"
            spellCheck="off"
            placeholder="Password (no password by default)"
            style={{width: "200px"}}
            className={classNames({"valid-field": password !== ""})}
            onChange={(e) => { setPassword(e.target.value) }}
          >
          </input>
        </div>
    </div>  
  );

  let addModeratorPassword = (
    <div style={{ marginTop: "20px", marginBottom: "20px", maxWidth: "424px", lineHeight: "24px" }}>
      <div
        style={{ position: "relative" }}
        className={classNames({ "space-container": true, "green": modPassword !== "" })}
      >
        {modPassword !== "" ?
          <i className="fas fa-check green checkmark"></i>
          :
          <></>
        }
        <h3>4) Moderator Password <span style={{color: "gray"}}>(Optional)</span></h3>
      </div>
      <p>If you’d also like to enable moderator settings for your room, you’ll need to add a moderator password. Once your room is created, anyone with access to the moderator password can function as a host, which is useful for organizing events or parties.</p>
      <div className="space-container">
        <input
          type="password"
          style={{ width: "200px" }}
          autoCapitalize="off"
          autoComplete="off"
          spellCheck="off"
          placeholder="Optional moderation password"
          style={{width: "200px"}}
          className={classNames({"valid-field": modPassword !== ""})}
          onChange={(e) => { setModPassword(e.target.value) }}
        >
        </input>
      </div>
    </div>   
  );

  let createButton = (
    <div style={{marginBottom: "30px"}}>
      <button
        className="submit-button"
        style={{
          marginTop: "25px",
          backgroundColor: canSubmit ? "#0EBF55" : "white",
          border: canSubmit ? "" : "1px solid gray",
          color: canSubmit ? "white" : "gray",
          cursor: canSubmit ? "pointer" : "default",
          outline: "none"
        }}
        onClick={() => { canSubmit ? submitForm() : {}}}
      >
        Create Space!
      </button>
      {error ?
        <div className="red" style={{ marginTop: '10px' }}>{error}</div>
        : null}
    </div>
  );

  return (
    <div className="vertical-center-container create-private">
      {createRoomDescription}
      {addRoomName}
      {addEnvironment}
      {addPassword}
      {addModeratorPassword}
      {createButton}
    </div>
  );
}

export default function CreatePrivate() {
  return (
    <div className="vertical-center-container">
      <GameHeader 
        showCreateNewRoom={false}
      />
      <CreatePrivateForm />
    </div>
  );
}
