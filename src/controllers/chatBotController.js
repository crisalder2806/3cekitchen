require("dotenv").config();

import request from "request";
import axios from "axios";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const BASE_URL = process.env.BASE_URL;
let fullName,lastName = null;
let gender = 'anh/chị';

const weekOfMonth = (date) => {
  // Copy date so don't affect original
  var d = new Date(+date);
  if (isNaN(d)) return;
  // Move to previous Monday
  d.setDate(d.getDate() - d.getDay() + 1);
  // Week number is ceil date/7
  return Math.ceil(d.getDate()/7);
}

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
  return axios.get("https://graph.facebook.com/" + psid, {
    params: {
      fields: 'first_name,last_name,gender',
      access_token: process.env.PAGE_ACCESS_TOKEN
    }
  });
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

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event tos the appropriate handler function
      if (webhook_event.message) {
        retrieveProfile(sender_psid).then(res => {
          lastName = res.data.first_name + ' ' + res.data.last_name;
          gender = res.data.gender === 'male' ? 'anh' : 'chị';
          handleMessage(sender_psid);
        });
      } else if (webhook_event.postback) {
        if (webhook_event.postback.payload === 'USER_DEFINED_PAYLOAD') {
          retrieveProfile(sender_psid).then(res => {
            lastName = res.data.first_name + ' ' + res.data.last_name;;
            gender = res.data.gender === 'male' ? 'anh' : 'chị';
            handleMessage(sender_psid);
          });
        } else {
          handlePostback(sender_psid, webhook_event.postback);
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
function handleMessage(sender_psid) {
  let response;

  response = {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text:
          `Cảm ơn ${gender} ${lastName} đã liên hệ với bếp 3CE, ${gender} cần tìm hiểu thông tin nào dưới đây ạ?`,
        buttons: [
          {
            type: "postback",
            title: "Xem các gói ăn",
            payload: "mealplan",
          },
          {
            type: "postback",
            title: "Xem menu tuần này",
            payload: "menu",
          },
          {
            type: "postback",
            title: "Tư vấn trực tiếp",
            payload: "contact"
          }
        ],
      },
    },
  };

  // Send the response message
  callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === "menu") {
    sendMenu(sender_psid);
  } else if (payload === "mealplan") {
    sendMealPlan(sender_psid);
  } else if (payload === "healthyplan") {
    sendHealthyPlan(sender_psid);
  } else if (payload === "massplan") {
    sendMassPlan(sender_psid);
  } else if (payload === "contact") {
    sendContact(sender_psid);
  } else if (payload === "menu") {
    sendMenu(sender_psid);
  }
}

function sendContact(sender_psid) {
  callSendAPI(sender_psid, {
    text: `Chào ${gender} ${lastName}, bếp sẽ nhanh chóng liên hệ lại. Trường hợp cần liên lạc ngay ${gender} vui lòng gọi vào SĐT 0936.574.674. Chúc ${gender} một ngày tốt lành.`
  });
}

async function sendHealthyPlan(sender_psid) {
  await callSendAPI(sender_psid, {
    attachment: {
      type: "image", 
      payload: {
        url: `${BASE_URL}/images/healthyPricing.jpg`, 
        is_reusable: true
      }
    }
  });
  
  await callSendAPI(sender_psid, {
    text: "Gói ăn này dành cho những người làm văn phòng, ít có điều kiện tập luyện, hoặc tập luyện với cường độ thấp (2, 3 lần/tuần)."
  });

  await callSendAPI(sender_psid, {
    text: `Ngoài ra nếu ${gender} muốn tăng cơ, giảm mỡ thì gói này cũng rất phù hợp ạ.`
  });

  await callSendAPI(sender_psid, {
    text: `Đây là bảng giá của bên bếp, ngoài ra nếu ${gender} muốn đặt buổi lẻ thì cũng được ạ.`
  });
}

async function sendMassPlan(sender_psid) {
  await callSendAPI(sender_psid, {
    attachment: {
      type: "image", 
      payload: {
        url: `${BASE_URL}/images/massPricing.jpg`, 
        is_reusable: true
      }
    }
  });

  await callSendAPI(sender_psid, {
    text: "Gói ăn này dành cho dân chuyên gym, người tập lâu năm, có nhu cầu tăng cân, siết cơ..."
  });

  await callSendAPI(sender_psid, {
    text: "Gói này cũng dành cho những người là vận động viên cần bổ sung số lượng protein lớn"
  });

  await callSendAPI(sender_psid, {
    text: "Mỗi phần ăn đều sẽ cung cấp lượng protein hầu như là gấp đôi so với gói Healthy."
  });

  await callSendAPI(sender_psid, {
    text: `Đây là bảng giá của bên bếp, ngoài ra nếu ${gender} muốn đặt buổi lẻ thì cũng được ạ.`
  });
}

async function sendMealPlan(sender_psid) {
  await callSendAPI(sender_psid, {
    text: `Hiện bếp 3CE có cung cấp 2 gói ăn như sau, ${gender} bấm vào nút TÌM HIỂU THÊM để hiểu về gói ăn này nhé ạ`,
  });

  const mealPlans = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
           {
            "title":"GÓI HEALTHY/WEIGHT LOSS",
            "image_url":`${BASE_URL}/images/healthyplan.jpg`,
            "subtitle":"Dành cho dân văn phòng, ít tập....",
            "buttons":[
              {
                "type":"postback",
                "title":"TÌM HIỂU THÊM",
                "payload":"healthyplan"
              }              
            ]      
          },
          {
            "title":"GÓI DOUBLE MEAT",
            "image_url":`${BASE_URL}/images/massplan.jpg`,
            "subtitle":"Dành cho người siết cơ, tập luyện....",
            "buttons":[
              {
                "type":"postback",
                "title":"TÌM HIỂU THÊM",
                "payload":"massplan"
              }              
            ]      
          }
        ]
      }
    }
  }

  await callSendAPI(sender_psid, mealPlans);
}

async function sendMenu(sender_psid) {
  await callSendAPI(sender_psid, {
    text: `Bếp gửi ${gender} menu tuần này để ${gender} tham khảo ạ`,
  });
  
  await callSendAPI(sender_psid, {
    attachment: {
      type: "image", 
      payload: {
        url: `${BASE_URL}/images/menu/${weekOfMonth(new Date())}.jpg`, 
        is_reusable: true
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

  return axios.post('https://graph.facebook.com/v7.0/me/messages',
  request_body,
  {
    params: {
      access_token: process.env.PAGE_ACCESS_TOKEN
    }
  });
}

module.exports = {
  test,
  getWebhook,
  postWebhook,
};
