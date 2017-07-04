const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const apiaiApp = require('apiai')(process.env.APIAI_ACCESS_TOKEN || "testaitoken");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, function () {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

/* For Facebook Validation */
app.get('/webhook', function (req, res) {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post('/webhook', function (req, res) {
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach(function (entry) {
      entry.messaging.forEach(function (event) {
        if (event.message && event.message.text) {
          sendMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});
/* papagaj funkcija koja ponavlja
function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: {text:text}
    }
  }, function (error, response) {
    if (error) {
        console.log('Error sending message: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
}*/
function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;
  
   console.log('*** SeNdMessage  for api.ai query ***');

  let apiai = apiaiApp.textRequest(text, {
    sessionId: 'Humordevbotsession' // use any arbitrary id
  });

  apiai.on('response', function(response)  {
  let aiText = response.result.fulfillment.speech;

    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: process.env.FB_PAGE_ACCESS_TOKEN || 'testtolen'},
      method: 'POST',
      json: {
        recipient: {id: sender},
        message: {text: aiText}
      }
    }, (error, response) => {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });  });

  apiai.on('error', (error) => {
    console.log(error);
  });

  apiai.end();
}


app.post('/ai', (req, res) => {

  
   console.log('*** SeNdMessage  for ai post query ***');

  if (req.body.result.action === 'vreme') {
    let city = req.body.result.parameters['geo-city'];
    let restUrl = 'http://api.openweathermap.org/data/2.5/weather?APPID='+process.env.WEATHER_API_KEY+'&q='+city;

    request.get(restUrl, (err, response, body) => {
      if (!err && response.statusCode == 200) {
        let json = JSON.parse(body);
        let msg = json.weather[0].description + ' and the temperature is ' + ((json.main.temp-32)* 5 / 9) + ' ℉';
        return res.json({
          speech: msg,
          displayText: msg,
          source: 'vreme'});
      } else {
        return res.status(400).json({
          status: {
            code: 400,
            errorType: 'I failed to look up the city name.'}});
      }});
  }});
