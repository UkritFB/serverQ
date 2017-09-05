(function () {

var appFact = angular.module('tree.factory', []);
appFact.factory("URLConfig", [function () {
  return {
    tree: "/setting/menu.json"
  }
}]);

var appServ = angular.module('tree.service', ['tree.factory']);
appServ.service("TreeService", ["$http", "URLConfig", function ($http, URLConfig) {
  this.getTree = function () {
    return $http.get(URLConfig.tree);
  };
}]);

var appDirect = angular.module('tree.directives', []);
appDirect.directive('nodeTree', function () {
  return {
    template: '<node ng-repeat="node in tree track by $index"></node>',
    replace: true,
    restrict: 'E',
    scope: {
      tree: '=children'
    }
  };
});
appDirect.directive('node', function ($compile) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/setting/node.html', // HTML for a single node.
    link: function (scope, element) {
    if (scope.node && scope.node.children && scope.node.children.length > 0) {
      scope.node.childrenVisibility = true;
      var childNode = $compile('<ul class="tree" ng-if="!node.childrenVisibility"><node-tree children="node.children"></node-tree></ul>')(scope);
        element.append(childNode);
      } 
      else {
        scope.node.childrenVisibility = false;
      }
    },
    controller: ["$scope", function ($scope) {
      // This function is for just toggle the visibility of children
      $scope.toggleVisibility = function (node) {
        if (node.children) {
          node.childrenVisibility = !node.childrenVisibility;
        }
      };
      // Here We are marking check/un-check all the nodes.
      $scope.checkNode = function (node) {
        node.checked = !node.checked;
        function checkChildren(c) {
          angular.forEach(c.children, function (c) {
            c.checked = node.checked;
            checkChildren(c);
          });
        }
        checkChildren(node);
      };
    }]
  };
});

/* 
// config controller 
*/
angular.module('myApp')
.controller('roleCtrl', function($scope, TreeService, $timeout, appService) {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Setting';

  var tc = this;
  buildTree();
  function buildTree() {
    TreeService.getTree().then(function (result) {
      
      // console.log(result.data);
      // tc.tree = result.data;         
      socket.emit('web-setting-get-data', { base: 'serverRole', query: {}}, function(err, ret)  {        
        $scope.setRole = ret[0].role;
        // ret[0].roleLevel[0].checked = true;
        // tc.tree = ret[0].roleLevel;


        var employeeList;
        var success = false;
        socket.emit('web-setting-get-data', { base: 'employee', query: {_id: '0021'} }, function(err, ret)  {
          // $timeout(function() {
            employeeList = ret[0].employee;
            employeeList.sort(function(a, b){
              return a.userName-b.userName;
            });
            for (var i in employeeList)  {
              employeeList[i]['passTemp'] = '';
              employeeList[i]['passConfirm'] = '';
            }
            $scope.employeeList = employeeList;
          // }, 100);
        });



      });

    }, function (result) {
      alert("Tree no available, Error: " + result);
    });
  }

});

/* 
// config controller 
*/
angular.module('myApp')
.controller('settingCtrl', function($scope, $state, $mdDialog, $timeout, $interval, $window, $sce, $http, appService) {
// $timeout(function() {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Setting';

  $scope.griSettBranch = {
    data: []
  };
  $scope.gridSettBrs = {};

  var branchList = [];

  var setBranchRefresh = function ()  {
    socket.emit('web-setting-get-online', function(err, ret)  {
      // Table Online branch
      branchList = [];
      for (var i in ret.online)  {
        var item = ret.online[i];
        var obj = { branchID: item.branchInfo.branchID, branchName: item.branchInfo.branchName, clientIP: item.branchInfo.clientIP, 
        cntTotal: item.realtime.counter.total , cntLogon: item.realtime.counter.logon, cntService: item.realtime.counter.service, 
        empTotal: item.realtime.employee.total, qWait: item.realtime.qtdBuff.wait };
        branchList.push(obj);
      }
      $scope.griSettBranch.data = branchList;
    });
  }

  setBranchRefresh(); 
  var intervalSetting = $interval(function(){
    setBranchRefresh(); 
  },1000*3);
  $scope.$on('$destroy', function () { $interval.cancel(intervalSetting); });

  $scope.gotoBranchConfig = function(ip)  {
    // $window.open('http://'+ip+':8001/setting/websetting.html', 'C-Sharpcorner');
    // alert('http://'+ip+':8001/setting/websetting.html');
    $scope.detailFrame = $sce.trustAsResourceUrl('http://'+ip+':8001/setting/websetting.html?logon=auto');
  }

  window.uploadDone=function(){
    // alert('onLoad');
    // var req = {
    //   method: 'POST',
    //   url: 'http://192.168.1.103:8001',
    //   headers: {
    //     'Content-Type': undefined,
    //   },
    //   data: { test: 'test' }
    // }
    // $http(req).then(function(ret){
    //   alert(ret+'1');
    // }, function(ret){
    //   alert(ret+'2');
    // });
  }

});

})();


