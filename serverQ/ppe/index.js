(function () {

// angular.module('myApp', ['ui.router', 'ngMaterial', 'ngMessages']);
angular.module('myApp', [ 'ngMaterial', 'ui.router',  // Main core
                          'ui.bootstrap', 'dataGrid', 'pagination',  // dataTable
                          'ngMessages',  'ngAnimate','ngAria', // login form
                          'tree.service', 'tree.directives',  // tree structure
                          // 'chart.js', // chart
                        ]);

/* 
// Theme control 
*/
angular.module('myApp')
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
  .primaryPalette('teal', {
  //   // 'default': '700', // by default use shade 400 from the pink palette for primary intentions
  })
  // .accentPalette('lime', {
  //   'default': '100', // by default use shade 400 from the pink palette for primary intentions
  // })
  // .warnPalette('deep-orange', {
  //   'default': '100', // by default use shade 400 from the pink palette for primary intentions
  // })
  // .backgroundPalette('grey', {
  //   'default': '900', // by default use shade 400 from the pink palette for primary intentions
  //   'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
  //   'hue-2': '500', // use shade 600 for the <code>md-hue-2</code> class
  //   'hue-3': '900' // use shade A100 for the <code>md-hue-3</code> class
  // })
  // .dark();
  $mdThemingProvider.theme('docs-dark')
  .dark();
});

/* 
// UI-router
*/
angular.module('myApp')
.config(function($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider) {
  // for handling trailing slashes
  $urlMatcherFactoryProvider.strictMode(false);
  // $urlRouterProvider.otherwise("/projects.login");  
  $stateProvider
  .state({
    name: "projects",
    // url: "/projects",
    url: "Qserver",
    template: '<ui-view></ui-view>'
    // template: '<h4 style="margin-left: 20px;">Smart-Q setting</h4><ui-view></ui-view>'
    // template: '<md-toolbar class="md-hue-3"><div class="md-toolbar-tools" style=""><h2>Smart-Q setting</h2></div></md-toolbar><ui-view></ui-view>'    
  })
  // .state('login', {
  //   url: "/login",
  //   templateUrl: "login.html",
  //   controller:"loginCtrl"
  // })
  .state({
    name: "projects.login",
    templateUrl: "login.html",
    controller:"loginCtrl"
  })
  .state({
    name: "projects.home",
    templateUrl: "/home/home.html",
    controller:"homeCtrl"
  })
  .state({
    name: "projects.report",
    templateUrl: "/report/report.html",
    controller:"reportCtrl"
  })  
  .state({
    name: "projects.setuser",
    templateUrl: "/setting/setuser.html",
    controller:"roleCtrl as tc"
  })  
  .state({
    name: "projects.setbranch",
    templateUrl: "/setting/setbranch.html",
    controller:"settingCtrl"
  })
});

/* 
// Main controller
*/
angular.module('myApp')
.controller("serverController", function ($scope, $location, $state, $timeout, $mdSidenav, appService) {
  // var w = window.innerWidth;
  // var h = window.innerHeight;

  // $scope.ctrl.selectedItem = 'login';
  // $location.url("/login");
  // $scope.screenHeight = (window.innerHeight*2/3)+'px;';

  $timeout(function() {
    $scope.ctrl.selectedItem = 'login';
    $state.go("projects.login");
    $scope.screenHeight = (window.innerHeight*2/3)+'px;';
  }, 100);


  var socket = io.connect();
  // retryConnectOnFailure(RETRY_INTERVAL);

  socket.on('connect', function() {
    appService.socketInit(socket);
    // alert('Sock.io-Connect')
  });

  socket.on('disconnect', function () {
    // $timeout(function() {
    // socket = io.connect({ 'force new connection': true, secure: true, rejectUnauthorized: null});
    $timeout(function() {
      $scope.ctrl.selectedItem = 'login';
      $state.go("projects.login");
      // $scope.ctrl.selectedItem = 'login';
      // $location.url("/login");
    }, 100);
    // }, 1000);
  });

  $scope.gotoMenu = function(menu)  {
  $timeout(function()  {
    if (appService.getLogin() == 1)  {
      // $scope.ctrl.selectedItem = menu;
      // $state.go("projects."+menu);
      $scope.ctrl.selectedItem = menu;
      $state.go("projects."+menu);
    }
    else  {
      $scope.ctrl.selectedItem = 'login';
      $state.go("projects.login");
      // $scope.ctrl.selectedItem = 'login';
      // $location.url("/login");
    }
  }, 100);
  }

  this.settButton = true;
  this.addRemoveUser = false;       
  this.branchConfig = false;

  this.toggleRight = buildToggler('right');
  this.toggleLeft = buildToggler('left');

  function buildToggler(componentId) {
    return function() {
      $mdSidenav(componentId).toggle();
    }
  }

// var retryConnectOnFailure = function(retryInMilliseconds) {
//   $timeout(function(){
//     if (!connected) {
//       $.get('/ping', function(data) {
//         connected = true;
//         window.location.href = unescape(window.location.pathname);
//       });
//       retryConnectOnFailure(retryInMilliseconds);
//     }
//   }, retryInMilliseconds);
// }

})

/* 
// Service control 
*/
angular.module('myApp')
.service('appService', function() {
  var socket = null;
  var login = 0;
  var socketInit = function(newSock) {
      socket = newSock;
  };
  var getSocket = function(){
    return socket;
  };
  var loginInit = function (value) {
    login = value;
  };
  var getLogin = function(){
    return login;
  };
  return {
    socketInit: socketInit,
    getSocket: getSocket,
    loginInit: loginInit,
    getLogin: getLogin,
  };
});

/* 
// Login controller 
*/
angular.module('myApp')
.controller('loginCtrl',function($scope, $state, $mdDialog, $timeout, appService) {
// $timeout(function() {
 
  appService.loginInit(0);
  $scope.ctrl.loginText = 'login';
  $scope.ctrl.settButton = true;
  $scope.ctrl.menuText = 'Login';

  $scope.submit = function (ev) {
    var socket = appService.getSocket();
    var usrLogon = $scope.vm.formData.name;
    var pwdLogon = $scope.vm.formData.password;
    // socket.emit('websetting-get-data', { table: 'general' }, function(err, data)  {
    socket.emit('web-login-get-user', { base: 'configs' }, function(err, ret)  {
      var data = ret.general;
      if (data.techName == usrLogon && data.techPassword == pwdLogon)  {
        appService.loginInit(1);
        $scope.ctrl.loginText = 'logout';
        $scope.ctrl.selectedItem = 'home';
        $scope.ctrl.settButton = false;
        $state.go("projects.home");
      }
      else  {
        $mdDialog.show(
          $mdDialog.alert()
          .title('Alert')
          .textContent('Password was wrong')
          .clickOutsideToClose(false)
          .ok('OK!')
        );
      }
    });
  };

// }, 1000);
});


})();
