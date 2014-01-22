var redis = require('redis'),
  config = require('../config');

var keyPlayers = config.keyPrefix + 'player';

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
  if (!name) {
    res.json({
      code: 1,
      message: 'Name is required'
    });
    return
  }

  redisClient.zscore(keyPlayers, name, function (err, score) {
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
      redisClient.zadd(keyPlayers, 0, name);
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

function getTopPlayers(num, cb) {
  redisClient.zrevrange(keyPlayers, 0, num - 1, function (err, names) {
    try {
      var indexInit = names.indexOf('init');
      if (~indexInit)
        names.splice(indexInit, 1);
    } catch (e) {
      console.log(e);
    }
    if (!names.length) {
      cb([]);
    } else {
      var scoreList = [];
      names.forEach(function (name) {
        redisClient.zscore(keyPlayers, name, function (err, score) {
          scoreList.push({
            name: name,
            score: score
          });
          if (scoreList.length == names.length) {
            cb(scoreList);
          }
        });
      })
    }
  })
}


score.list = function (req, res) {
  getTopPlayers(0, function (list) {
    res.json(list);
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
  redisClient.zincrby(keyPlayers, 1, req.session.name, function (err, score) {
    res.json({
      score: score
    });
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

    // broadcast top3
    getTopPlayers(3, function (list) {
      channelClient.lpush('top3', JSON.stringify(list));
    })
  })
}

score.top3 = function (req, res) {

}

/**
 * Clear a ZSET and expire it after config.redis.ttl
 */
score.clear = function (req, res) {
  redisClient.del(keyPlayers);
  redisClient.zadd(keyPlayers, -1, 'init');
  redisClient.expire(keyPlayers, config.redis.ttl);
  res.json(0);
}


exports.session = session;
exports.score = score