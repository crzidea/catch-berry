var redis = require('redis');
var async = require('async');
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
  async.waterfall([

    function (cb) {
      redisClient.zscore(keyPlayers, name, function (err, score) {
        if (score !== null) {
          if (req.body.name) {
            // name == req.session.name
            return cb(Error('Name was used'));
          }
        } else {
          redisClient.zadd(keyPlayers, 0, name);
          req.session.name = name;
        }
        cb(err, score);
      })
    },
    function (score, cb) {
      redisClient.multi()
        .zcard(keyPlayers)
        .zrank(keyPlayers, name)
        .exec(
          function (err, replies) {
            var rank = replies[0] - replies[1];
            req.session.rank = rank;
            var chOpts = {
              appid: config.channel.appId,
              timestamp: Date.now(),
              topics: 'chat,rank,rankChanged'
            }
            chOpts.token = crypto.createHash('md5')
              .update([
                config.channel.appSecret,
                chOpts.timestamp,
                chOpts.topics
              ].join(':'))
              .digest('hex');
            cb(err, {
              chOpts: chOpts,
              name: req.session.name,
              score: parseInt(score),
              rank: parseInt(rank)
            });
          }
      )
    }

  ], function (err, results) {
    if (err) {
      res.json({
        code: 2,
        message: err.message
      })
    } else {
      res.json(results);
    }
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
    return res.json({
      code: 1,
      message: 'Login required'
    });
  }
  redisClient.multi()
    .zincrby(keyPlayers, 1, req.session.name)
    .zcard(keyPlayers)
    .zrank(keyPlayers, req.session.name)
    .exec(
      function (err, replies) {
        var score = replies[0];
        var rank = replies[1] - replies[2];
        if (rank != req.session.rank) {
          console.log(req.session.name, req.session.rank, rank);
          req.session.rank = rank;
          channelClient.lpush('rankChanged', JSON.stringify({
            name: req.session.name,
            rank: rank
          }));
        }
        if (rank <= config.numRank) {
          // broadcast top3
          getTopPlayers(config.numRank, function (list) {
            channelClient.lpush('rank', JSON.stringify(list));
          })
        }
        channelClient.lpush(
          'score',
          JSON.stringify({
            name: req.session.name,
            score: score
          })
        );
        res.json({
          score: score,
          rank: rank
        });
      }
  );
}

/**
 * Clear a ZSET and expire it after config.redis.ttl
 */
score.clear = function (req, res) {
  redisClient.del(keyPlayers);
  res.json(0);
}

score.rank = function (req, res) {
  redisClient.multi()
    .zcard(keyPlayers)
    .zrank(keyPlayers, req.session.name)
    .exec(
      function (err, replies) {
        res.json(replies[0] - replies[1]);
      }
  );
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
