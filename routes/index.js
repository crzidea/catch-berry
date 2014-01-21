var redis = require('redis'),
  config = require('../config');

var idKey = config.keyPrefix + 'id',
  recentKey = config.keyPrefix + 'recent';

var redisClient = redis.createClient(config.redis.port, config.redis.host);
var channelClient = redis.createClient(config.channel.port, config.channel.host);
redisClient.auth(config.redis.pass);
channelClient.auth(config.channel.appSecret);
[redisClient, channelClient].forEach(function (client) {
  client.on('error', function (err) {
    console.log(err);
  })
})

var session = {};

/**
 * POST /session
 * req.body.name(String)
 */
session.start = function (req, res) {
  var name = req.body.name || req.session.name;
  console.log(req.body);
  if (!name) {
    res.json({
      code: 1,
      message: 'Name is required'
    });
    return
  }

  var key = config.keyPrefix + name
  redisClient.get(key, function (err, score) {
    if (score !== null) {
      if (!req.body.name) {
        // name == req.session.name
        res.json({
          score: Number(score)
        });
      } else {
        res.json({
          code: 2,
          message: 'Name was used'
        });
      }
    } else {
      redisClient.setex(key, config.redis.ttl, 0)
      req.session.name = name;
      res.json({
        score: 0
      })
    }
  })
}


var score = {};
var nameReg = RegExp('^' + config.keyPrefix + '(.*)');
var allExp = config.keyPrefix + '*';
score.list = function (req, res) {
  redisClient.keys(allExp, function (err, keys) {
    if (!keys.length) {
      res.json([]);
      return
    }

    var scoreList = [];
    keys.forEach(function (k) {
      redisClient.get(k, function (err, score) {
        scoreList.push({
          name: k.match(nameReg).pop(),
          score: score
        });
        if (scoreList.length == keys.length) {
          res.json(scoreList);
        }
      })
    })
  })
}
score.get = function (req, res) {
  if (!req.session.name) {
    res.json({
      code: 1,
      message: 'Login required'
    });
    return
  }
  var key = config.keyPrefix + req.session.name;
  redisClient.incr(key, function (err, score) {
    channelClient.lpush(
      config.channel.topic,
      JSON.stringify({
        name: req.session.name,
        score: score
      }),
      function (err, reply) {
        console.log(err, reply);
      }
    );
    res.json({
      score: score
    });
  });
  redisClient.expire(key, config.redis.ttl);
}
score.clear = function (req, res) {
  redisClient.keys(allExp, function (err, keys) {
    keys.forEach(function (k) {
      redisClient.del(k);
    });
  });
  res.json(0);
}


exports.session = session;
exports.score = score