require("dotenv").config();

import request from "request";
import axios from "axios";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
let firstName, lastName = null;

const test = (req, res) => {
  var messageData = {
    get_started: {
      payload: "USER_DEFINED_PAYLOAD"
    }
  };

  // Start the request
  request(
    {
      uri: "https://graph.facebook.com/v7.0/me/messenger_profile",
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: "POST",
      json: messageData
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        // Print out the response body
        res.send(body);
      } else {
        res.sendStatus(403);
      }
    }
  );
};

const retrieveProfile = (psid) => {
  // Retrieve profile
  return axios.get("https://graph.facebook.com/" + psid), {
    params: {
      fields: 'first_name,last_name',
      access_token: process.env.PAGE_ACCESS_TOKEN
    }
  }
  request(
    {
      uri: "https://graph.facebook.com/" + psid,
      qs: {
        fields: 'first_name,last_name',
        access_token: process.env.PAGE_ACCESS_TOKEN 
      },
      method: "GET"
    },
    (error, response, body) => {
      if (!error && response.statusCode == 200) {
        // Print out the response body
        const res = JSON.parse(body);
        firstName = res.first_name;
        lastName = res.last_name;
      }
    }
  );
};

const getWebhook = (req, res) => {
  // Your verify token. Should be a random string.

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

const postWebhook = (req, res) => {
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(async function (entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event tos the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        if (webhook_event.postback.payload === 'USER_DEFINED_PAYLOAD') {
          retrieveProfile(sender_psid).then(function(res) {
            console.log(res, 333);
            handleMessage(sender_psid);
          });
        } else {
          handlePostback(sender_psid, webhook_event.postback, req.baseUrl);
        }
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
};

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;

  // Checks if the message contains text
  // if (received_message.text) {
  //   response = {
  //       text: "Chào bạn, bạn muốn xem menu không?",
  //   };
  // }

  response = {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text:
          `Cảm ơn bạn ${lastName} đã nhắn tin cho bếp 3CE, bạn cần tìm hiểu thông tin nào dưới đây ạ?`,
        buttons: [
          {
            type: "postback",
            title: "Báo giá các gói ăn",
            payload: "pricing",
          },
          {
            type: "postback",
            title: "Xem menu",
            payload: "menu",
          },
        ],
      },
    },
  };

  // Send the response message
  callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback, baseUrl) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;
  console.log(payload);

  // Set the response based on the postback payload
  if (payload === "menu") {
    sendMenu(sender_psid);
  } else if (payload === "pricing") {
    response = { text: "Lượn đi cho nước trong bạn êy" };
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

async function sendMenu(sender_psid) {
  await callSendAPI(sender_psid, {
    text: "Bếp gửi bạn menu tuần này để bạn tham khảo ạ",
  });
  await callSendAPI(sender_psid, {
    attachment: {
      type: "template",
      payload: {
        template_type: "media",
        elements: [
          {
            media_type: "image",
            url:
              "https://www.facebook.com/bep.3ce.danang/photos/pcb.1659856317530533/1659854784197353",
          },
        ],
      },
    },
  });
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  };

  request({
    uri: "https://graph.facebook.com/v7.0/me/messages",
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: "POST",
    json: request_body,
  });
}

module.exports = {
  test,
  getWebhook,
  postWebhook,
};
