angular.element(document).ready(function () {
  var channel = new Channel({
    topics: "score",
    token: "1ae7251784b3a77167795ca08a7fcd2f",
    timestamp: "1390291727884",
    appid: "1da52hlqpj"
  });
  channel.onmessage = function (msg) {
    console.log(msg.topic, msg.data);
  }
})