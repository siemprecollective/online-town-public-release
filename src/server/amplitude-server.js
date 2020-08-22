import axios from 'axios';

export function logAmpEvent(userId, eventType, eventProperties, isProd) {
  let apiKey = "BLANK";
  if (isProd) {
    apiKey = "BLANK";
  }

  axios({
    method: "post",
    url: "https://api.amplitude.com/2/httpapi",
    headers: {
      'Content-Type':'application/json',
      'Accept':'*/*'
    },
    data: {
      "api_key": apiKey,
      "events": [
        {
          "user_id": userId,
          "event_type": eventType,
          "event_properties": eventProperties,
        }
      ]
    }
  })
}