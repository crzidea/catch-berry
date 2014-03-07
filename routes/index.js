var redis = require('redis');
var crypto = require('crypto');
var config = require('../config');

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
    return res.json({
      code: 1,
      message: 'Name is required'
    });
  }
  redisClient.zscore(keyPlayers, name, function (err, score) {
    if (score !== null && req.body.name) {
      // name == req.session.name
      return res.json({
        code: 2,
        message: 'Name was used'
      });
    } else {
      redisClient.zadd(keyPlayers, 0, name);
      req.session.name = name;
    }

    var chOpts = {
      appid: config.channel.appId,
      timestamp: Date.now(),
      topics: 'rank,chat'
    }
    chOpts.token = crypto.createHash('md5')
      .update([
        config.channel.appSecret,
        chOpts.timestamp,
        chOpts.topics
      ].join(':'))
      .digest('hex');

    res.json({
      chOpts: chOpts,
      score: parseInt(score)
    });
  })
}


var score = {};
var nameReg = RegExp('^' + config.keyPrefix + '(.*)');
var allExp = config.keyPrefix + '*';

function getTopPlayers(num, cb) {
  redisClient.zrevrangebyscore(keyPlayers, '+inf', '-inf',
    'withscores', 'limit', 0, num, function (err, replies) {
      var players = [];
      while (replies.length) {
        players.push({
          name: replies.shift(),
          score: replies.shift()
        });
      }
      cb(players);
    }
  );
}


score.list = function (req, res) {
  getTopPlayers(-1, function (list) {
    res.json(list);
  })
}
score.incr = function (req, res) {
  if (!req.session.name) {
    res.json({
      code: 1,
      message: 'Login required'
    });
    return
  }
  redisClient.zincrby(keyPlayers, 1, req.session.name,
    function (err, score) {
      res.json({
        score: score
      });
      channelClient.lpush(
        'score',
        JSON.stringify({
          name: req.session.name,
          score: score
        })
      );

      // broadcast top3
      getTopPlayers(config.numRank, function (list) {
        channelClient.lpush('rank', JSON.stringify(list));
      })
    }
  )
}

/**
 * Clear a ZSET and expire it after config.redis.ttl
 */
score.clear = function (req, res) {
  redisClient.del(keyPlayers);
  res.json(0);
}

var chat = function (req, res) {
  channelClient.lpush('chat',
    JSON.stringify({
      name: req.session.name,
      msg: req.body.msg
    }),
    function (err, reply) {
      res.json({
        code: 0
      });
    }
  )
}

exports.session = session;
exports.score = score;
exports.chat = chat;
