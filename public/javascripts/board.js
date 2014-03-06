angular.module('app', ['ngResource'])
  .controller('BoardCtrl', function ($scope, $resource) {


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

        switch (msg.topic) {
        case 'chat':
          console.log(msg.data);
          break
        case 'score':
          var player = JSON.parse(msg.data);
          // force a $digest
          $scope.$apply(function () {
            var isNew = true;
            for (var i = 0; i < $scope.list.length; i++) {
              if ($scope.list[i].name == player.name) {
                isNew = false;
                $scope.list[i].score = player.score;
                break
              }
            };
            isNew && $scope.list.push(player);
            $scope.list = $scope.list.sort(function (a, b) {
              return b.score - a.score;
            })
          })
          break
        }

      }
    })


  });
