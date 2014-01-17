var formidable = require('formidable'),
  redis = require('redis'),
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

var pictures = {};

/**
 * LRANGE pic:recent 0 -1
 * picIds.forEach; GET pic:[id]
 */
pictures.list = function (req, res) {
  redisClient.lrange(recentKey, 0, -1, function (err, ids) {
    var recentPics = [];
    ids.forEach(function (id) {
      redisClient.get(config.keyPrefix + id, function (err, file) {
        recentPics.push({
          file: file
        });
        if (recentPics.length == ids.length)
          res.json(recentPics);
      })
    })
  })
};


/**
 * INCR pic:id
 * SET pic:[id] [url]
 * channel.lpush('pic', [url])
 * LPUSH pic:recent [id]
 * while reply-- > 10; RPOP pic:recent
 */
pictures.upload = function (req, res) {
  var form = new formidable.IncomingForm()
  form.uploadDir = 'uploads';
  form.keepExtensions = true;

  form.parse(req, function (err, fields, files) {
    try {
      
      var file = files.picture.path.match(/^uploads\/(.*)/).pop();
      channelClient.lpush('picture', file, function (err, reply) {
        res.json({
          success: true
        })
      });

      redisClient.incr(idKey, function (err, id) {
        redisClient.set(config.keyPrefix + id, file,
          function (err, reply) {}
        );
        redisClient.lpush(recentKey, id, function (err, length) {
          while (length-- > config.maxRecentPics)
            redisClient.rpop(recentKey, function (err, reply) {})
        });
      })

    } catch (e) {
      console.log(e);
    }
  });

};

exports.pictures = pictures;