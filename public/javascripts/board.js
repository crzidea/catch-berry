var app = angular.module('app', ['ngResource']);
app.controller('BoardCtrl', function ($scope, $resource) {


  var Score = $resource('/api/score');
  Score.query(function (list) {
    $scope.list = list.sort(function (a, b) {
      return b.score - a.score;
    });
  });
  $scope.delete = function () {
    Score.delete();
    $scope.list = [];
  }

  angular.element(document).ready(function () {
    var channel = new Channel({
      appid: "1ddc4hwpuq",
      timestamp: 1394087670572,
      token: "23494fa2b917e7cc7d2f0530c4b659f0",
      topics: "score,chat"
    });
    channel.onmessage = function (msg) {

      var obj = JSON.parse(msg.data);
      // force a $digest
      $scope.$apply(function () {
        switch (msg.topic) {
        case 'chat':
          for (var i = 0; i < $scope.list.length; i++) {
            if ($scope.list[i].name == obj.name) {
              $scope.list[i].msg = obj.msg;
              setTimeout((function (player) {
                return function () {
                  $scope.$apply(function () {
                    if (player.msg == obj.msg)
                      delete player.msg
                  });
                }
              })($scope.list[i]), 2000);
            }
          }
          break
        case 'score':
          var isNew = true;
          for (var i = 0; i < $scope.list.length; i++) {
            if ($scope.list[i].name == obj.name) {
              isNew = false;
              $scope.list[i].score = obj.score;
              break
            }
          };
          isNew && $scope.list.push(obj);
          $scope.list = $scope.list.sort(function (a, b) {
            return b.score - a.score;
          })
          break
        }
      })

    }
  })


});
