/* 
// get IP addresss 
*/
function getAddrIP (callback)  {
  var os = require('os');
  var hostIP = '';
  var macAddr = '';                    
  var netMask = '';                    
  var cpu = os.cpus();
  console.log('');
  console.log('<------------------>');
  console.log('<- Smart-Q Server ->');
  console.log('<------------------>');
  console.log(cpu.length+'-Core', os.cpus()[0].model);
  console.log('Total mem', os.totalmem());
  console.log('Free mem', os.freemem());
  console.log('Found', os.platform(), os.release());
  var n = 0;
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
    ifaces[ifname].forEach(function (iface) {
      if (++n >= (Object.keys(ifaces).length*ifaces[ifname].length)) {
        var obj = {hostIP:hostIP, macAddr: macAddr, netMask: netMask}; 
        // console.log ('Network info ->');
        console.log (obj);
        callback(obj);
      }
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if ('IPv4' !== iface.family || iface.internal !== false)  return;
      // this single interface has multiple ipv4 addresses
      if (alias >= 1) console.log(ifname + ':' + alias, iface.address);
      else {  // this interface has only one ipv4 adress
        if (ifname[0] == 'e') {  hostIP = iface.address; macAddr = iface.mac; netMask = iface.netmask;}
        if (ifname[0] == 'w' && hostIP == '') {  hostIP = iface.address; macAddr = iface.mac; netMask = iface.netmask;}
      }
    });
  });  
}

/* 
// Database connection
*/
var MongoClient = require('mongodb').MongoClient;
function baseConnect(baseName, callback)  {
  // MongoClient.connect(baseName,  {  server: { socketOptions: { connectTimeoutMS: 3600000,  socketTimeoutMS: 3600000 } } }, 
  MongoClient.connect(baseName,  {  
    server: { 
      socketOptions: { connectTimeoutMS: 3600000,  socketTimeoutMS: 3600000 },
      sslValidate :false, 
      checkServerIdentity : false,
  } },
  function (err, _db) {
    if (err) {
      console.log('MongoClient.connect err ->',err); 
      throw err;
    };
    _db.collections(function(err, collections)  {
      var tmp = []; 
      for (var i in collections)  {
        // console.log(collections[i]);
        tmp.push(collections[i].s.name);
      }
      callback(_db, tmp);
    });
  });
}

/* 
// connection to IP addr / MongoDB 
*/
// module.exports.firstInitialzation = function (callback) {      //use password
function firstInitialzation (callback) {
  var fs = require('fs'); 
  fs.readFile('config.json', 'utf8', function(err, data)  {
    // console.log(err, data);
    if (!err)  {
      var cfg = JSON.parse(data);
      console.log(cfg);
    }

    getAddrIP(function(ip)  {
      // baseConnect('mongodb://webapp:ppetechAT1234@localhost:27217/mbedq?ssl=true', function (dbx, mb) {
      //   baseConnect('mongodb://webapp:ppetechAT1234@localhost:27217/report?ssl=true', function (dbr, mr) {
      baseConnect('mongodb://localhost:27017/qcore', function (dbx, mb) {
        baseConnect('mongodb://localhost:27017/report', function (dbr, mr) {
          callback(ip, dbx, mb, dbr, mr);
        });
      });  
    });

  });
}

/* 
// HTTP function
*/
function handler (req, res)  {  
  var url = require('url');
  var fs = require('fs');
  var path = url.parse(req.url).pathname;

  var head = [
    {'Content-Type': 'text/html'}, {'Content-Type': 'text/css'}, {'Content-Type': 'text/javascript'}, {'Content-Type': 'image/jpeg' }, 
    {'Content-Type': 'image/jpg'}, {'Content-Type': 'image/png' }, {'Content-Type': 'image/gif'},  {'Content-Type': 'image/x-icon'}, 
    {'Content-Type': 'video/mp4'},
  ];
  var type = ['.html', '.css', '.js', 'jpeg', 'jpg', 'png', 'gif', 'ico', 'mp4'];
  var text = {};
  for (var i in type)  {
    var n = path.search(type[i]);
    if (n != -1)  { 
      text = head[i];  break;  
    }
  }
  if (req.method.toLowerCase() == 'get') {  // method GET
    if (path == '/')  {
      path = '/index.html';
      text = {'Content-Type': 'text/html'};
    }


    fs.readFile(__dirname + path, function(error, data){
      if (!error) {

        console.log('Get->', path, text); 
    
        res.writeHead(200, text);
        res.end(data);
      }
      else  {

        console.log('Err->', path, text); 

        res.writeHead(404, {"Content-Type": "text/plain"});
        res.end("opps this doesn't exist - 404");
      }
    });
  } 
  else  {
    if (req.method.toLowerCase() == 'post') {  //method POST
      var body='';
      req.on('data', function (data) {
        body += data;
      });
      req.on('end',function()  {
        var post =  qs.parse(body);
        console.log('post->',post);
        // if (post.formUsername == 'ppe' && post.formPassword == 'ppetech')  {
        //   res.writeHead(302, {Location: 'http://'+ip+':9442/restore.html?pass=ok'});
        //   res.end('Password correct...');
        //   systemRestore(post);
        // }
        // else  {
        //   //res.writeHead(302, {'content-type': 'text/plain'});
        //   res.writeHead(302, {Location: 'http://'+ip+':9442/restore.html?pass=wrong'});
        //   res.end('Password was wrong!');
        // }
      });
    }
  }
}

/* 
// HTTP & Socket IO initialize
*/
function httpInit (httpPort) {
  var app = require('http').createServer(handler);  // no express
  var io = require('socket.io').listen(app);
  // app.listen(globalValue.read('general').httpPort);
  app.listen(httpPort);
  console.log('Http listing ->', httpPort);
  return io;
}

/* 
// Zero padding 
*/
function zeroPadding (Qnumber, width) {
  width -= Qnumber.toString().length;
  if ( width > 0 )  {
    return new Array( width + (/\./.test( Qnumber ) ? 2 : 1) ).join( '0' ) + Qnumber;
  }
  return Qnumber + ""; // always return a string
}

/* 
// Eminter event define 
*/
var SimpleEE = function() {
  this.events = {};
};
SimpleEE.prototype.on = function(eventname, callback) {
  this.events[eventname] || (this.events[eventname] = []);
  this.events[eventname].push(callback);
};
SimpleEE.prototype.emit = function(eventname) {
  var args = Array.prototype.slice.call(arguments, 1);
  if (this.events[eventname]) {
    this.events[eventname].forEach(function(callback) {
      callback.apply(this, args);
    });
  }
};
var emitter = new SimpleEE();

/* 
// Load reserve list 
*/
function listFiles (folder)  {
  var fs = require('fs');
  var files = fs.readdirSync(folder);
  var path = require('path');
  //console.log(files);
  return(files);
}

/*
// Save Q-today
*/
function saveQtoday (globalValue, collName, qtdBuff, branchInfo, callback)  {
  console.log('Writing Q-today ->', collName, branchInfo.branchID);
  var async = require('async');
  var q = async.queue(function (item, callback) {
    item.pressTime = new Date(item.pressTime);
    item.beginTime  = new Date(item.beginTime);
    item.endTime = new Date(item.endTime);
    if (item.transfer.length)  {
      for (var i in item.transfer)  {
        item.transfer[i].pressTime = new Date(item.transfer[i].pressTime);
        item.transfer[i].beginTime  = new Date(item.transfer[i].beginTime);
        item.transfer[i].endTime = new Date(item.transfer[i].endTime);
      }
    }

    var dt = new Date(item.pressTime);
    dt = ''+dt.getFullYear()+'/'+(dt.getMonth()+1)+'/'+dt.getDate();
    var _id = branchInfo.branchID+'-'+dt;

    var initDate = new Date(item.pressTime);
    initDate.setHours(0);
    initDate.setMinutes(0);
    initDate.setSeconds(0);

    // var dbr = globalValue.read('base').dbr;
    var dbr = globalValue.value['base'].dbr;

    // console.log('Writing Q-today ->', collName, _id, branchID, initDate);
    // dbr.collection(collName).findAndModify({_id: _id}, {}, { $set: { branchID: branchID, date: initDate }, $push: {data: item}},
    // { upsert: true }, function (err, ret) {
    dbr.collection(collName).update({_id: _id}, { $set: { branchID: branchInfo.branchID, branchName: branchInfo.branchName, date: initDate }, 
    $push: {data: item}}, { upsert: true },
    function (err, ret) {
      // console.log('------>', err);
        callback(ret);
    });
  });
  q.drain = function() {
    callback (0);          
  }
  if (qtdBuff.length)  {
    q.push(qtdBuff, function (data) {
    });
  }
  else callback(1);
}

/*
// Save Employee
*/
function saveEmployee (globalValue, collName, employee, branchInfo, callback)  {  
  for (var i in employee)  {
    employee[i].lastLogon[0] = new Date(employee[i].lastLogon[0]);
    employee[i].lastLogon[1] = new Date(employee[i].lastLogon[1]);
    employee[i].startDate = new Date(employee[i].startDate);
  }
  var dbr = globalValue.value['base'].dbr;
  var obj = { branchID: branchInfo.branchID, branchName: branchInfo.branchName, employee: employee };
  console.log('Writing ->', collName, branchInfo.branchID);
  dbr.collection(collName).update({_id: branchInfo.branchID}, { $set: obj }, { upsert: true }, function (err, ret) {
    callback(0, obj);
  });
  // dbr.collection(collName).find({}).toArray(function(err, retAry) {
  //   var obj = { branchID: branchInfo.branchID, branchName: branchInfo.branchName, employee: employee };
  //   if (!retAry.length)  {
  //     var index = 0;
  //   }
  //   else  {
  //     var employeeList = retAry[0].employeeList;
  //     var index = null;
  //     for (var i = 0; i < employeeList.length; i++)  {
  //       if (employeeList[i].branchID == branchInfo.branchID)  break;
  //     }
  //     index = i;
  //   }      
  //   console.log('Writing ->', collName, branchInfo.branchID, 'index ->', index);
  //   dbr.collection(collName).update({}, { $set: {[`employeeList.${index}`]: obj } }, { upsert: true },
  //   function (err, ret) {
  //     callback(0);
  //   });
  // });
}

/* 
// Load employee
*/
function loadEmployee (dbr, callback) {
  dbr.collection('employee').find({_id: '0000'}).toArray(function(err, retAry) {
    // console.log('Employee ->', err, ret);
    if (!retAry.length)  {
      var obj = { 
        branchID: '0000',
        branchName: 'server',
        employee: [
          {
            userName: "admin",
            fullName: "admin",
            roleLevel: "SV Admin",
            lastLogon: [ new Date(), new Date() ],
            wrongLogon: 0,
            userState: "Enable",
            firstLogon: false,
            startDate: new Date(),
            expireDate: null,
            passPolicy: false,
            passWord: [ {
              passWord: "458175b8cea5d1ce393c18994c1de70b",
              dateCreate: null,
              dateExpiry: null
            }],
            login: { name: "", id: "" },
            passTemp: "",
            passConfirm: ""
          }
        ]
      }
      dbr.collection('employee').update({_id: '0000'}, { $set: obj }, { upsert: true }, function (err, ret) {
        callback(1, 1);
      });
      return;
    }
    dbr.collection('employee').count(function(err, count){
      callback(0, count);
    });
  });
}

/* 
// Role level init
*/
function roleInit (dbr, callback) {
  dbr.collection('serverRole').find({}).sort({_id: 1}).toArray(function(err, retAry) {
    if (!retAry.length)  {
      var fs = require('fs'); 
      fs.readFile('ppe/setting/menu.json', 'utf8', function(err, data)  {
        if (err)  var menu = [];
        else  var menu = JSON.parse(data);
        // console.log(menu);
        var obj = {
          role: [
            {
              roleName: 'SV Admin',
              roleLevel: menu,
            },
            {
              roleName: 'BR Admin',
              roleLevel: menu,
            },
            {
              roleName: 'BR User',
              roleLevel: menu,
            }
          ]
        };
        dbr.collection('serverRole').update({}, {"$set": obj}, { upsert: true }, function (err, item)  {
          console.log('Create first role ->', err);
          dbr.collection('serverRole').find({}).sort({_id: 1}).toArray(function(err, retAry) {
            callback(err,  retAry[0].role);
          });
        });

      });
      return;
    }
    callback(err, retAry[0].role);
  });
}

/* 
// Load table
*/
function loadTable (globalValue, callback)  {
  console.log('...');

  // var dbr = globalValue.read('base').dbr;
  var dbr = globalValue.value['base'].dbr;

  var async = require('async');
  async.series(
  [
    function(callback) {
      loadEmployee(dbr, function (err, item) {
        // globalValue.value['employee'] = item;
        console.log('employee -> ', item, 'items');
        callback(null, 1);
      });
    },
    function(callback) {
      roleInit (dbr, function(err, item) {
        globalValue.value['role'] = item;
        // console.log('Role level ->', item.length);
        console.log('Role level ->', item.length, 'items');
        callback(null, 2)
      });
    },
    function(callback) {
      callback(null, 2);
    },
  ],  
  function(error, results) {
    // console.log(results);
    // console.log (globalValue.read('holdBuff'));
    console.log('...');
    callback (0);
  });
}

/*
// get data 
*/
function getData (globalValue, data, callback)  {
  // var obj = globalValue.read(data.table);
  // callback(0, obj);
  var base = data.base;
  var dbr = globalValue.read('base').dbr;
  var query = data.query;
  dbr.collection(base).find(query).sort({_id: 1}).toArray(function(err, retAry) {
    // console.log('configs ->', 'name = '+retAry[0].name);
    if (!retAry.length)  callback(1, []);
    else  {
      callback(0, retAry);  // loded finish
    }
  });
}

/*
// write data 
*/
function writeData (globalValue, data, callback)  {

  var dbr = globalValue.read('base').dbr;
  var obj = data.data;
  var base = data.base;

  if (base == 'employee')  {
    for (var i in obj.employee)  {
      obj.employee[i].lastLogon[0] = new Date(obj.employee[i].lastLogon[0]);
      obj.employee[i].lastLogon[1] = new Date(obj.employee[i].lastLogon[1]);
      obj.employee[i].startDate = new Date(obj.employee[i].startDate);
    }
  }

  // dbr.collection(base).findAndModify({}, {}, {$set: obj}, { upsert: true }, function (err, ret) {
  dbr.collection(base).update({}, { $set: obj }, { upsert: true }, function (err, ret) {
    if (err) var text =   'Write data error.';
    else  var text = 'Write data OK. Warning -> After all setting finish please reboot system.';
    console.log(text);
    if (base == 'template')  {
      dbx.collection('Qtoday').drop(function (e) {
        globalValue.write('qtdBuff', []);
        var counterList = globalValue.read('counter');
        for (var i in counterList)  {
          counterList[i].status = 'standby';
          counterList[i].Q = null;
        }
        var rangeQList = globalValue.read('rangeQ');
        for (var i in rangeQList)  {
          rangeQList[i].now = rangeQList[i].min;
        }
        callback(err, {text: text});
      });
    }
    else  callback(err, {text: text});
  });

}

/*
// Password encode 
*/
function encrypData (data, callback)  {
  var crypto = require('crypto'), algorithm = 'aes-128-cbc', key = 'Pas$w0rd';  
  var cipher = crypto.createCipher(algorithm,key);
  var crypted = cipher.update(data.password,'utf8','hex');
  crypted += cipher.final('hex');
  callback (0, { passWord: crypted });
}

/*
// Dashboard  
*/
function dashBoard (dbr, cond, callback)  {
  var map = function() {
    var Qtoday = this.data;
    var Qtotal = Qtoday.length;
    emit(this.branchID,  { branchID: this.branchID, branchName: this.branchName, Qtotal: Qtotal, Qtoday: Qtoday});
  }
  var reduce = function(bID, bData) {  
    var result = { branchID: '', branchName: '', Qtotal: 0, Qtoday: []};
    for (var i = 0; i < bData.length; i++) {
      result.Qtotal += bData[i].Qtotal;
      result.branchID = bData[i].branchID;
      result.branchName = bData[i].branchName;
    }
    for (var j in bData)  {
      var one = bData[j];
      var count = one.Qtoday.length;
      for (var i = 0; i < count; i++)  {
        result.Qtoday.push(one.Qtoday[i]);
      }
    }
    return result;
  }
  var final = function(bID, reduceQ)  {
    reduceQ['Qcomplete'] = 0;
    reduceQ['Qcancel'] = 0;
    reduceQ['Qundefine'] = 0;
    reduceQ['completePeriod'] =  [0,0,0,0,0,0,0,0,0,0,0,0];
    reduceQ['cancelPeriod'] =  [0,0,0,0,0,0,0,0,0,0,0,0];
    reduceQ['satValue'] =  [0,0,0,0,0,0];
    var jb = [];
    reduceQ['jobName'] = [];
    var emp = [];
    reduceQ['employee'] = [];
    var ct = [];
    reduceQ['counter'] = [];

    for (var i = 0; i < reduceQ.Qtoday.length; i++)  {
      var item = reduceQ.Qtoday[i];

      var dt = new Date(item.pressTime);
      var t = dt.getHours();
      if (t < 8)  t = 0;
      else  {
        if (t > 19)  t = 11;
        else  t -= 8;
      }

      var comVal = 0;
      var canVal = 0;
      var undefVal = 0;
      switch(item.status)  {
        case 'complete':
        reduceQ.Qcomplete++;
        reduceQ.completePeriod[t]++;        
        comVal = 1;
        break;
        case 'cancel':
        reduceQ.Qcancel++;
        reduceQ.cancelPeriod[t]++;
        canVal = 1;
        break;
        default:
        reduceQ.Qundefine++;
        undefVal = 1;
        break;
      }

      item.jobName = item.jobName.trim();

      if (item.satisfy != null)  {
        var n = Number(item.satisfy);
        reduceQ.satValue[n]++;
      }
      else  {
        n = 0;
        reduceQ.satValue[n]++;
      }

      var j =  emp.indexOf(item.userName.userName);
      if (j < 0)  {
        emp.push(item.userName.userName);
        var obj = {userName: item.userName.userName, fullName: item.userName.fullName, Qtotal: 0, satValue: [0,0,0,0,0,0] };
        obj.satValue[n]++;
        obj.Qtotal++;
        reduceQ.employee.push(obj);
      }
      else  {
        reduceQ.employee[j].satValue[n]++;
        reduceQ.employee[j].Qtotal++;
      }

      var j =  jb.indexOf(item.jobName);
      if (j < 0)  {
        jb.push(item.jobName);
        reduceQ.jobName.push({jobName: item.jobName, Qtotal: 1, Qcomplete: comVal, Qcancel: canVal, Qundefine: undefVal});
      }
      else  {
        reduceQ.jobName[j].Qtotal++;
        reduceQ.jobName[j].Qcomplete += comVal;
        reduceQ.jobName[j].Qcancel += canVal;
        reduceQ.jobName[j].Qundefine += undefVal;
      }

      var j =  ct.indexOf(item.counter.id);
      if (j < 0)  {
        ct.push(item.counter.id);
        reduceQ.counter.push({counter: item.counter.id, Qtotal: 1, Qcomplete: comVal, Qcancel: canVal, Qundefine: undefVal});
      }
      else  {
        reduceQ.counter[j].Qtotal++;
        reduceQ.counter[j].Qcomplete += comVal;
        reduceQ.counter[j].Qcancel += canVal;
        reduceQ.counter[j].Qundefine += undefVal;
      }
    }

    delete reduceQ.Qtoday;
    return reduceQ;
  }

  var brQuery = [];
  if (cond.branchList.length)  {
    for (var i in cond.branchList)  {
      brQuery.push({branchID: cond.branchList[i].name});  
    }
    var query = { $and:[{date: { $gte: cond.startDate }}, {date: { $lte: cond.stopDate }}, { $or: brQuery }]};
  }
  else  {    
    var query = { $and:[{date: { $gte: cond.startDate }}, {date: { $lte: cond.stopDate }}]};
  }
  // console.log('Map-reduce for dashboard start ->', cond);
  console.log('Map-reduce for dashboard start ->');
  dbr.collection('br-Qtoday').mapReduce ( map, 
                                          reduce, 
                                          { 
                                            query: query, 
                                            out: cond.collOut,
                                            finalize: final 
                                          }, 
  function(err, dat)  {
    dbr.collection(cond.collOut).find({}).sort({_id: 1}).toArray(function (err, data) {     
      // dbr.collection(tblName).drop(function (err) {
      console.log('Map-reduce for dashboard stopt ->', err);
      callback(err, data);
      // });
    });
  });
}

/*
// Dashboard  
*/
function reportMapReduce (dbr, cond, callback)  {
  var map = function() {
    var Qtoday = this.data;
    var Qtotal = Qtoday.length;
    emit(this.branchID,  { branchID: this.branchID, branchName: this.branchName, Qtotal: Qtotal, Qtoday: Qtoday});
  }
  var reduce = function(bID, bData) {  
    var result = { branchID: '', branchName: '', Qtotal: 0, Qtoday: []};
    for (var i = 0; i < bData.length; i++) {
      result.Qtotal += bData[i].Qtotal;
      result.branchID = bData[i].branchID;
      result.branchName = bData[i].branchName;
    }
    for (var j in bData)  {
      var one = bData[j];
      var count = one.Qtoday.length;
      for (var i = 0; i < count; i++)  {
        result.Qtoday.push(one.Qtoday[i]);
      }
    }
    return result;
  }
  var final = function(bID, reduceQ)  {
 
    var total = {
      Qcomplete: 0,
      Qcancel: 0,
      Qundefine: 0,
      Qtotal: 0,
    }
    var period = {
      Qcomplete: [0,0,0,0,0,0,0,0,0,0,0,0],
      Qcancel: [0,0,0,0,0,0,0,0,0,0,0,0],
      Qundefine: [0,0,0,0,0,0,0,0,0,0,0,0],
      Qtotal: [0,0,0,0,0,0,0,0,0,0,0,0],
    }
    var jb = [];
    var jobName = [];
    var emp = [];
    var employee = [];
    var ct = [];
    var counter = [];

    for (var i in reduceQ.Qtoday)  {
      var item = reduceQ.Qtoday[i];

      var dt = new Date(item.pressTime);
      var t = dt.getHours();
      if (t < 8)  t = 0;
      else  {
        if (t > 19)  t = 11;
        else  t -= 8;
      }

      if (item.satisfy != null) var n = Number(item.satisfy);
      else  n = 0;

      total.Qtotal++;
      period.Qtotal[t]++;        

      var comVal = 0;
      var canVal = 0;
      var undefVal = 0;

      switch(item.status)  {
        case 'complete':
        total.Qcomplete++;
        period.Qcomplete[t]++;        
        comVal = 1;
        break;
        case 'cancel':
        total.Qcancel++;
        period.Qcancel[t]++;
        canVal = 1;
        break;
        default:
        total.Qundefine++;
        period.Qundefine[t]++;
        undefVal = 1;
        break;
      } 

      var j =  jb.indexOf(item.jobName);
      if (j < 0)  {
        jb.push(item.jobName);
        var obj = {jobName: item.jobName, Qtotal: 1, Qcomplete: comVal, Qcancel: canVal, Qundefine: undefVal,
                      period: [0,0,0,0,0,0,0,0,0,0,0,0], satValue: [0,0,0,0,0,0], };
        obj.period[t]++;
        obj.satValue[n]++;
        jobName.push(obj);
      }
      else  {
        jobName[j].period[t]++;
        jobName[j].satValue[n]++;
        jobName[j].Qtotal++;
        jobName[j].Qcomplete += comVal;
        jobName[j].Qcancel += canVal;
        jobName[j].Qundefine += undefVal;
      }

      var j =  emp.indexOf(item.userName.userName);
      if (j < 0)  {
        emp.push(item.userName.userName);
        var obj = { userName: item.userName.userName, fullName: item.userName.fullName, Qtotal: 1,  Qcomplete: comVal, 
                    Qcancel: canVal, Qundefine: undefVal, satValue: [0,0,0,0,0,0], period: [0,0,0,0,0,0,0,0,0,0,0,0],
                    jobName: [{jobName: item.jobName, Qtotal: 1 }]};
        obj.satValue[n]++;
        obj.period[t]++;
        employee.push(obj);
      }
      else  {
        employee[j].period[t]++;
        employee[j].satValue[n]++;
        employee[j].Qtotal++;
        employee[j].Qcomplete += comVal;
        employee[j].Qcancel += canVal;
        employee[j].Qundefine += undefVal;
        for (var k = 0; k < employee[j].jobName.length; k++)  {
          if (employee[j].jobName[k].jobName == item.jobName) break;
        }
        if (k >= employee[j].jobName.length)  {
          employee[j].jobName.push({ jobName: item.jobName, Qtotal: 0});
          var k = employee[j].jobName.length-1;
        }
        employee[j].jobName[k].Qtotal++;
      }

      var j =  ct.indexOf(item.counter.id);
      if (j < 0)  {
        ct.push(item.counter.id);
        counter.push({counter: item.counter.id, Qtotal: 1, Qcomplete: comVal, Qcancel: canVal, Qundefine: undefVal});
      }
      else  {
        counter[j].Qtotal++;
        counter[j].Qcomplete += comVal;
        counter[j].Qcancel += canVal;
        counter[j].Qundefine += undefVal;
      }

    }

    reduceQ['total'] = total;
    reduceQ['period'] = period;
    reduceQ['jobName'] = jobName;
    reduceQ['employee'] = employee;
    reduceQ['counter'] = counter;

    delete reduceQ.Qtoday;
    return reduceQ;
  }
  var brQuery = [];
  if (cond.branchList.length)  {
    for (var i in cond.branchList)  {
      brQuery.push({branchID: cond.branchList[i].name});  
    }
    var query = { $and:[{date: { $gte: cond.startDate }}, {date: { $lte: cond.stopDate }}, { $or: brQuery }]};
  }
  else  {    
    var query = { $and:[{date: { $gte: cond.startDate }}, {date: { $lte: cond.stopDate }}]};
  }
  console.log('Map-reduce for report start ->');
  dbr.collection('br-Qtoday').mapReduce ( map, 
                                          reduce, 
                                          { 
                                            query: query, 
                                            out: cond.collOut,
                                            finalize: final 
                                          }, 
  function(err, dat)  {
    dbr.collection(cond.collOut).find({}).sort({_id: 1}).toArray(function (err, data) {     
      // dbr.collection(tblName).drop(function (err) {
      console.log('Map-reduce for report stop ->', err);
      callback(err, data);
      // });
    });
  });
}

module.exports = {
  firstInitialzation: firstInitialzation,
  httpInit: httpInit,
  zeroPadding: zeroPadding,
  emitter: emitter,
  listFiles: listFiles,
  saveQtoday: saveQtoday,
  saveEmployee: saveEmployee,
  loadTable: loadTable,
  getData: getData,
  writeData: writeData,
  encrypData: encrypData,
  dashBoard: dashBoard,
  reportMapReduce: reportMapReduce,
};

