(function () {

/* 
// config controller 
*/
angular.module('myApp')
.controller('SwitchDemoCtrl', function($scope) {
  $scope.data = {
    cb1: true,
    cb4: true,
    cb5: false
  };

  $scope.message = 'false';

  $scope.onChange = function(cbState) {
    $scope.message = cbState;
  };
});
.controller('homeCtrl', function($scope, $state, $mdDialog, $timeout, $interval, appService) {
// $timeout(function() {

  var socket = appService.getSocket();

  $scope.ctrl.menuText = 'Home';

  $scope.gridBranch = {
    data: []
  };
  $scope.gridBrs = {};

  var branchList = [];
  var cond = {
    startDate: new Date(),
    stopDate: new Date(),
    branchList: []
  }

  cond.startDate = new Date(2017, 6, 23);
  $scope.startDate = cond.startDate;

  cond.startDate.setHours(0, 0, 0);
  cond.stopDate.setHours(23, 59, 0);

  // var homeTimeout = null;
  var homeRefresh = function ()  {
    socket.emit('web-home-get-data', cond, function(err, ret)  {
      // Table Online branch
      branchList = [];
      for (var i in ret.online)  {
        var item = ret.online[i];
        var obj = { branchID: item.branchInfo.branchID, branchName: item.branchInfo.branchName, clientIP: item.branchInfo.clientIP, 
        cntTotal: item.realtime.counter.total , cntLogon: item.realtime.counter.logon, cntService: item.realtime.counter.service, 
        empTotal: item.realtime.employee.total, qWait: item.realtime.qtdBuff.wait };
        branchList.push(obj);
      }
      $scope.gridBranch.data = branchList;

      var Qtotal = [0,0,0,0,0,0,0,0,0,0,0,0];
      var Qcomplete = [0,0,0,0,0,0,0,0,0,0,0,0];
      var Qcancel = [0,0,0,0,0,0,0,0,0,0,0,0];

      var jobName = [];
      var jobTotal = [];
      var jobComplete = [];
      var jobCancel = [];
      var jobUndefine = [];
      var branchTopFive = [];
      var jobTopFive = [];

      var satValue = [0,0,0,0,0,0];

      // Dashboard sum loop
      for (var i in ret.dashboard)  {
        var item = ret.dashboard[i];      

        branchTopFive.push({branchID: item._id, Qtotal: item.value.Qtotal, Qcomplete: item.value.Qcomplete, Qcancel: item.value.Qcancel});

        for (var j in Qtotal)  {
          Qcomplete[j] += item.value.completePeriod[j];
          Qcancel[j] += item.value.cancelPeriod[j];
          Qtotal[j] = item.value.completePeriod[j] + item.value.cancelPeriod[j];
        }

        for (var j in item.value.jobName)  {
          var k =  jobName.indexOf(item.value.jobName[j].jobName);
          if (k < 0)  {
            jobName.push(item.value.jobName[j].jobName);
            jobTotal.push(item.value.jobName[j].Qtotal);
            jobComplete.push(item.value.jobName[j].Qcomplete);
            jobCancel.push(item.value.jobName[j].Qcancel);
            jobUndefine.push(item.value.jobName[j].Qundefine);
            jobTopFive.push({jobName: item.value.jobName[j].jobName, Qtotal: item.value.jobName[j].Qtotal, 
                             Qcomplete: item.value.jobName[j].Qcomplete, Qcancel: item.value.jobName[j].Qcancel});
          }
          else  {
            jobTotal[k] += item.value.jobName[j].Qtotal;
            jobComplete[k] += item.value.jobName[j].Qcomplete;
            jobCancel[k] += item.value.jobName[j].Qcancel;
            jobUndefine[k] += item.value.jobName[j].Qundefine;
            jobTopFive[k].Qtotal += item.value.jobName[j].Qtotal;
            jobTopFive[k].Qcomplete += item.value.jobName[j].Qcomplete;
            jobTopFive[k].Qcancel += item.value.jobName[j].Qcancel;
          }
        }

        for (var j in satValue)  {
          satValue[j] += item.value.satValue[j];
        }
      }
   
      // Combo chart
      comboData.datasets[0].data = Qtotal;
      comboData.datasets[1].data = Qcomplete;
      comboData.datasets[2].data = Qcancel;
      window.myComboChart.update();

      // Radar chart
      for (var i in jobName)  {
        jobName[i] = jobName[i].slice(0, 15);
      }
      radarData.labels = jobName;
      // radarData.datasets[0].data = jobTotal;
      radarData.datasets[0].data = jobComplete;
      radarData.datasets[1].data = jobCancel;
      window.myRadarChart.update();

      // Branch top five chart
      if (branchTopFive.length < 5)  {
        for (var i = branchTopFive.length; i < 5; i++)  {
          branchTopFive.push({branchID: '', Qtotal: 0, Qcomplete: 0, Qcancel: 0});
        }
      }
      else {
        branchTopFive = branchTopFive.slice(0, 5);
      }
      branchTopFive.sort(function(a, b){
        return b.Qtotal-a.Qtotal;
      });
      topBranchData.labels = [];
      topBranchData.datasets[0].data = [];
      topBranchData.datasets[1].data = [];
      // topBranchData.datasets[2].data = [];
      for (var i in branchTopFive)  {
        topBranchData.labels.push(branchTopFive[i].branchID);
        // topBranchData.datasets[0].data.push(branchTopFive[i].Qtotal);
        topBranchData.datasets[0].data.push(branchTopFive[i].Qcomplete);
        topBranchData.datasets[1].data.push(branchTopFive[i].Qcancel);
      }      
      window.myBranchHorChart.update();

      // Job-name top five chart
      if (jobTopFive.length < 5)  {
        for (var i = jobTopFive.length; i < 5; i++)  {
          jobTopFive.push({jobName: '', Qtotal: 0, Qcomplete: 0, Qcancel: 0});
        }
      }
      else {
        jobTopFive = jobTopFive.slice(0, 5);
      }
      jobTopFive.sort(function(a, b){
        return b.Qtotal-a.Qtotal;
      });

      // var topFiveJob = [];
      // var topFiveJobValue = [];
      // for (var i in jobTopFive)  {
      //   topFiveJob.push(jobTopFive[i].jobName.slice(0, 15));
      //   topFiveJobValue.push(jobTopFive[i].Qtotal);
      // }      
      // topJobData.labels = topFiveJob;
      // topJobData.datasets[0].data = topFiveJobValue;

      topJobData.labels = [];
      topJobData.datasets[0].data = [];
      topJobData.datasets[1].data = [];
      for (var i in jobTopFive)  {
        topJobData.labels.push(jobTopFive[i].jobName.slice(0, 15));
        topJobData.datasets[0].data.push(jobTopFive[i].Qcomplete);
        topJobData.datasets[1].data.push(jobTopFive[i].Qcancel);
      }      
      window.myJobHorChart.update();

      // Satisfy chart
      satisfyData.datasets[0].data = satValue;
      window.mySatChart.update();

      // homeTimeout = $timeout(function() {
      //   // $timeout.cancel(homeTimeout);
      //   // homeTimeout = null;
      //   homeRefresh(); 
      // }, 1000*3);
    });
  }

  // $scope.$on('$destroy', function () { $timeout.cancel(homeTimeout); });

  // if (homeTimeout == null)  homeRefresh(); 
  homeRefresh(); 
  var intervalHome = $interval(function(){
    homeRefresh(); 
  },1000*3);
  $scope.$on('$destroy', function () { $interval.cancel(intervalHome); });


  $scope.dateChange = function (sd)  {
    cond.startDate = $scope.startDate; //new Date(2017, 0, 1);
    cond.startDate.setHours(0, 0, 0);
    cond.stopDate.setHours(23, 59, 0);
    // if (homeTimeout != null)  $timeout.cancel(homeTimeout);
    homeRefresh(); 

  }

  // $scope.branchDetail = function(item, ev)  {
  //   alert(item.branchID);
  // }

  var color = Chart.helpers.color;

  var satisfyData = {
    labels: ["None", "level-1", "level-2", "level-3", "level-4", "level-5"],
    datasets: [
      // {
      //   type: 'line',
      //   label: 'Total',
      //   borderColor: window.chartColors.blue,
      //   borderWidth: 1,
      //   fill: false,
      //   // backgroundColor: color(window.chartColors.blue).alpha(0.2).rgbString(),
      //   // pointBackgroundColor: window.chartColors.red,
      //   data: [0,0,0,0,0,0],
      // }, 
      {
        type: 'bar',
        label: 'Satisfy',
        borderColor: window.chartColors.red,
        fill: true,
        backgroundColor: color(window.chartColors.red).alpha(0.2).rgbString(),
        borderWidth: 1,
        data: [0,0,0,0,0,0],
      }, 
      // {
      //   type: 'bar',
      //   label: 'Cancel',
      //   borderColor: window.chartColors.green,
      //   fill: true,
      //   backgroundColor: color(window.chartColors.green).alpha(0.2).rgbString(),
      //   borderWidth: 1,
      //   data: [0,0,0,0,0,0],
      // }
    ]
  };

  var verBarID = document.getElementById("canvasVerBar").getContext("2d");
  window.mySatChart = new Chart(verBarID, {
    type: 'bar',
    data: satisfyData,
      options: {
        responsive: true,
        legend: {
          position: 'top',
        },
        scales: {
          xAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'score'
            }
          }],
          yAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'total'
            }
          }]
        },
        title: {
          display: true,
          text: 'Total satisfy score',
        }
      }
  });

  var topJobData =  {
    labels: [],
    datasets: [
      {
        label: 'Complete',
        backgroundColor: color(window.chartColors.red).alpha(0.2).rgbString(),
        borderColor: window.chartColors.red,
        borderWidth: 1,
        data: [],
      }, 
      {
        label: 'Cancel',
        backgroundColor: color(window.chartColors.green).alpha(0.2).rgbString(),
        borderColor: window.chartColors.green,
        borderWidth: 1,
        data: [],
      }, 
    ],
  };

  var horJobID = document.getElementById("canvasHorBarJob").getContext("2d");
  window.myJobHorChart = new Chart(horJobID, {
    type: 'horizontalBar',
    data: topJobData,
    // options: {
    //   elements: {
    //     rectangle: {
    //       borderWidth: 1,
    //     }
    //   },
    //   responsive: true,
    //   legend: {
    //     position: 'right',
    //   },
    //   title: {
    //     display: true,
    //     text: 'Service top five'
    //   }
    // }
    options: {
      title:{
        display:true,
        text: 'Service top five'
      },
      tooltips: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      scales: {
        xAxes: [{
          stacked: true,
        }],
        yAxes: [{
          stacked: true
        }]
      }
    }

  });

  var radarData =  {
    labels: [],
    datasets: [
      // {
      //   label: "Total",
      //   backgroundColor: color(window.chartColors.blue).alpha(0.2).rgbString(),
      //   borderColor: window.chartColors.blue,
      //   pointBackgroundColor: window.chartColors.blue,
      //   borderWidth: 1,
      //   data: [],
      // }, 
      {
        label: "Complete",
        backgroundColor: color(window.chartColors.red).alpha(0.2).rgbString(),
        borderColor: window.chartColors.red,
        pointBackgroundColor: window.chartColors.red,
        borderWidth: 1,
        data: [],
      }, 
      {
        label: "Cancel",
        backgroundColor: color(window.chartColors.green).alpha(0.2).rgbString(),
        borderColor: window.chartColors.green,
        pointBackgroundColor: window.chartColors.green,
        borderWidth: 1,
        data: [],
      }, 
    ],
  };

  var radarID = document.getElementById("canvasRadar").getContext("2d");
  window.myRadarChart = new Chart(radarID, {
    type: 'radar',
    data: radarData,
    options: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Service type'
      },
      scale: {
        ticks: {
          beginAtZero: true
        }
      }
    }
 });

  var topBranchData =  {
    labels: [],
    datasets: [
      // {
      //   label: 'Total',
      //   backgroundColor: color(window.chartColors.blue).alpha(0.2).rgbString(),
      //   borderColor: window.chartColors.blue,
      //   borderWidth: 1,
      //   data: [],
      // }, 
      {
        label: 'Complete',
        backgroundColor: color(window.chartColors.red).alpha(0.2).rgbString(),
        borderColor: window.chartColors.red,
        borderWidth: 1,
        data: [],
      }, 
      {
        label: 'Cancel',
        backgroundColor: color(window.chartColors.green).alpha(0.2).rgbString(),
        borderColor: window.chartColors.green,
        borderWidth: 1,
        data: [],
      }, 
    ],
  };

  var horBranchID = document.getElementById("canvasHorBar").getContext("2d");
  window.myBranchHorChart = new Chart(horBranchID, {
    type: 'horizontalBar',
    data: topBranchData,
    // options: {
    //   elements: {
    //     rectangle: {
    //       borderWidth: 1,
    //     }
    //   },
    //   responsive: true,
    //   legend: {
    //     position: 'right',
    //   },
    //   title: {
    //     display: true,
    //     text: 'Branch top five'
    //   }
    // }
    options: {
      title:{
        display:true,
        text: 'Branch top five'
      },
      tooltips: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      scales: {
        xAxes: [{
          stacked: true,
        }],
        yAxes: [{
          stacked: true
        }]
      }
    }

  });

  var comboData = {
    labels: ["8.00", "9.00", "10.00", "11.00", "12.00", "13.00", "14.00", "15.00", "16.00", "17.00", "18.00", "19.00"],
    datasets: [
      {
        type: 'line',
        label: 'Total',
        borderColor: window.chartColors.blue,
        borderWidth: 1,
        fill: false,
        // backgroundColor: color(window.chartColors.blue).alpha(0.2).rgbString(),
        // pointBackgroundColor: window.chartColors.red,
        data: [0,0,0,0,0,0,0,0,0,0,0,0],
      }, 
      {
        type: 'bar',
        label: 'Complete',
        borderColor: window.chartColors.red,
        fill: true,
        backgroundColor: color(window.chartColors.red).alpha(0.2).rgbString(),
        borderWidth: 1,
        data: [0,0,0,0,0,0,0,0,0,0,0,0],
      }, 
      {
        type: 'bar',
        label: 'Cancel',
        borderColor: window.chartColors.green,
        fill: true,
        backgroundColor: color(window.chartColors.green).alpha(0.2).rgbString(),
        borderWidth: 1,
        data: [0,0,0,0,0,0,0,0,0,0,0,0],
      }
    ]

  };

  var comboID = document.getElementById("canvasCombo").getContext("2d");
  window.myComboChart = new Chart(comboID, {
    type: 'bar',
    data: comboData,
    // options: {
    //   responsive: true,
    //   title: {
    //     display: true,
    //     text: 'Q.in.each.hour'
    //   },
    //   tooltips: {
    //     mode: 'index',
    //     intersect: true
    //   }
    // }
      options: {
        responsive: true,
        legend: {
          position: 'top',
        },
        scales: {
          xAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Time'
            }
          }],
          yAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Queue'
            }
          }]
        },
        title: {
          display: true,
          text: 'Q.in.each.hour',
        }
      }
  });

});

})();