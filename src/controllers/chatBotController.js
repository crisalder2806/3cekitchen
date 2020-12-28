require("dotenv").config();

import request from "request";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const test = (req, res) => {
  return res.send("Hello again");
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
    body.entry.forEach(function (entry) {
      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback, req.baseUrl);
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
  if (received_message.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of our request to the Send API
    // response = {
    //     text: "Chào bạn, bạn muốn xem menu không?",
    // };

    response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Bạn có muốn xem menu không?",
          buttons: [
            {
              type: "postback",
              title: "Có",
              payload: "yes",
            },
            {
              type: "postback",
              title: "Không",
              payload: "no",
            },
          ],
        },
      },
    };
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "Is this the right picture?",
              subtitle: "Tap a button to answer.",
              image_url: attachment_url,
              buttons: [
                {
                  type: "postback",
                  title: "Có",
                  payload: "yes",
                },
                {
                  type: "postback",
                  title: "Không",
                  payload: "no",
                },
              ],
            },
          ],
        },
      },
    };
  }

  // Send the response message
  callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback, baseUrl) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === "yes") {
    sendMenu(sender_psid);
  } else if (payload === "no") {
    response = { text: "Lượn đi cho nước trong bạn êy" };
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

async function sendMenu(sender_psid) {
  await callSendAPI(sender_psid, { text: "Bếp gửi bạn menu tuần này để bạn tham khảo ạ" });
  await callSendAPI(sender_psid, { 
    "attachment": {
      "type": "template",
      "payload": {
         "template_type": "media",
         "elements": [
            {
               "media_type": "image",
               "url": "https://www.facebook.com/bep.3ce.danang/photos/pcb.1659856317530533/1659854784197353"
            }
         ]
      }
    }
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

  request(
    {
      uri: "https://graph.facebook.com/v7.0/me/messages",
      qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body,
  });

  // Send the HTTP request to the Messenger Platform
  // request(
  //   {
  //     uri: "https://graph.facebook.com/v7.0/me/messages",
  //     qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
  //     method: "POST",
  //     json: request_body,
  //   },
  //   (err, res, body) => {
  //     if (!err) {
  //       console.log("message sent!");
  //     } else {
  //       console.error("Unable to send message:" + err);
  //     }
  //   }
  // );
}

module.exports = {
  test,
  getWebhook,
  postWebhook,
};
