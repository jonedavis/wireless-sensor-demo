/* 
 * Wireless Sales Engineer Demo
 * This demo demonstrates how to use Commands to send temperature and humidity to Twilio which invokes a webhook
 * The webhook will send to a server you deployed which updates a dashboard.
 * With a small payload, it's ideal to use SMS over data for battery efficiency and cost. 
 * Visit https://github.com/SeeedDocument/Wio_LTE for full Seeed Wio LTE documentation.
*/

// Set the modem power pin when Wio LTE board under v1.2
digitalWrite(B2, 1);

var board;
var dht;
// It is required to set the APN outside the United States
var APN = "wireless.twilio.com";
var COMMANDS_SHORTCODE = "+2936";
// Leave USERNAME and PASSWORD empty
var USERNAME = "";
var PASSWORD = "";
// A word or phrase that triggers some logic on the board. This is purley an example.
var KEYPHRASE = "get readings";

function start() {
  WioLTE.setGrovePower(true);
  dht = require("DHT11").connect(WioLTE.D38[0]);
  wiolteStart();
}

function wiolteStart(debug_quectel, debug_at) {
  debug_quectel = debug_quectel || false;
  debug_at = debug_at || false;
  
  board = require('wiolte').connect(function(err) {
    // Delete old SMS messages
    board.SMS.delete("ALL");
    console.log("Connecting...");
    if (err) throw err;
    // You cant mobile-terminate to a device without a VPN
    // What does that mean? You can't remote log into a device with the IP generated from this getIP method
    // You must use the Interconnect product
    // https://www.twilio.com/docs/wireless/vpn
    board.getIP(print);
    setTimeout(connect, 3000);
  });
  
  board.debug(debug_quectel, debug_at);
}

function connect() {
  board.connect(APN, USERNAME, PASSWORD, function(err) {
    if (err) throw err;
    setTimeout(onConnected, 5000);
  });
}

function onConnected() {
  console.log("Connected...");
  board.geoLocStart(10000);
  // Send a Command every 10 seconds to Twilio
  setInterval(sendReadings, 10000);
  // Handle incoming SMS (Command)
  board.on("message", function(id){
    console.log('Received Command.');
    board.SMS.read(id, function(d, sms){
      if(d !== "OK") throw new Error(d);
      if (sms.text.toLowerCase() == KEYPHRASE) {
        // This would be a great spot to read input sent to device via SMS
        // Potentially do some additional logic and send results back to Twilio
        // How do you send an SMS to the device? With the Commands API.
        // https://www.twilio.com/docs/wireless/api/commands
        // Do nothing here
      }
    });
  });
}

function getDHTReadings() {
  return new Promise(function(resolve, reject) {
    var tempHumidity = "";
    // Grove - Temperature & Humidity Sensor (DHT11) readings
    // This takes several seconds to return results
    dht.read(function (readings) {
      // No error checking
      tempHumidity = readings.temp.toString() + "," + readings.rh.toString();
      resolve(tempHumidity);
    });
  });
}

function getGeolocation() {
  return new Promise(function(resolve, reject) {
    var coordinates = "";
    // Onboard GPS
    board.geoLocGet(function(err, coord) {
      // No error checking
      console.log(coordinates);
      coordinates = coord.lat + "," + coord.lng;
      resolve(coordinates);
    });
  });
}

function sendSMS(msg) {
  board.SMS.send(COMMANDS_SHORTCODE, msg, function(err) {
    if (err) console.log(err);
    console.log("Command sent.");
  });
}

function sendReadings() {
  getDHTReadings()
    .then(function (result) {
      sendSMS(result);
  });
}

/*
   * An example on how to get both DHT readings and Geolocation with Promises
   *
   * Promise.all([getDHTReadings(), getGeolocation()]).then(function(values) {
   *     console.log(values);
   * });
*/

start();