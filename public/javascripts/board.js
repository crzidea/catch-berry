angular.module('app', ['ngResource'])
  .controller('BoardCtrl', function ($scope, $resource) {


    var Score = $resource('/api/score');
    Score.query(function (list) {
      $scope.list = list.sort(function (a, b) {
        return b.score - a.score;
      });
    });

    angular.element(document).ready(function () {
      var channel = new Channel({
        topics: "score",
        token: "1ae7251784b3a77167795ca08a7fcd2f",
        timestamp: "1390291727884",
        appid: "1da52hlqpj"
      });
      channel.onmessage = function (msg) {

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

      }
    })


  });