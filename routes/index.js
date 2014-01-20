var redis = require('redis'),
  config = require('../config');

var idKey = config.keyPrefix + 'id',
  recentKey = config.keyPrefix + 'recent';

var redisClient = redis.createClient(config.redis.port, config.redis.host);
var channelClient = redis.createClient(config.channel.port, config.channel.host);
redisClient.auth(config.redis.pass);
channelClient.auth(config.channel.pass);
[redisClient, channelClient].forEach(function (client) {
  client.on('error', function (err) {
    console.log(err);
  })
})

var session = {};
session.start = function (req, res) {}

var score = {};
score.list = function (req, res) {}
score.scored = function (req, res) {}
score.get = function (req, res) {}
score.clear = function (req, res) {}


exports.session = session;
exports.score = score