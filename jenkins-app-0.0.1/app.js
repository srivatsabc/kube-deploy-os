var express = require('express');
const bodyParser = require('body-parser');
var propertiesreader = require('properties-reader');
const url = require('url');
var app = express();
var request = require('request');
let header = require('./utils/header');
require('dotenv').config();
var JSONPARSER = require('json-parser');
var JSONIFY = require('json-stringify');
const zlib = require('zlib');
var UnauthorizedError = require('./utils/errors/UnauthorizedError');
var unless = require('express-unless');
var dateFormat = require('dateformat');
const uuidv4 = require('uuid/v4');
var properties = propertiesreader(process.env.APP_PROPERTIES);

app.use(bodyParser.urlencoded({
  extended: true
}))

app.use(bodyParser.json())

app.post('/v1/jenkins/system-api/build', function (req, res) {
  console.log("\njenkins-app: " + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
  var __HTTP_SUCCESS__ = Number(properties.get('global_HTTP_CREATED_SUCCESS'));
  httpPost('system_api_filter', req, res, req.query.token,function(response) {
    console.log (response);
    res = header.setHeaders(res, __HTTP_SUCCESS__);
    res.end(response);
  });
})

app.post('/v1/jenkins/process-api/build', function (req, res) {
  console.log("\njenkins-app: " + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
  var __HTTP_SUCCESS__ = Number(properties.get('global_HTTP_CREATED_SUCCESS'));
  httpPost('process_api_filter', req, res, req.query.token,function(response) {
    console.log (response);
    res = header.setHeaders(res, __HTTP_SUCCESS__);
    res.end(response);
  });
})

app.post('/v1/jenkins/experience-api/build', function (req, res) {
  console.log("\njenkins-app: " + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
  var __HTTP_SUCCESS__ = Number(properties.get('global_HTTP_CREATED_SUCCESS'));
  httpPost('experience_api_filter', req, res, req.query.token,function(response) {
    console.log (response);
    res = header.setHeaders(res, __HTTP_SUCCESS__);
    res.end(response);
  });
})

app.post('/v1/jenkins/deploy-api/build', function (req, res) {
  console.log("\njenkins-app: " + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
  var __HTTP_SUCCESS__ = Number(properties.get('global_HTTP_CREATED_SUCCESS'));
  httpPost('kube_deploy_filter', req, res, req.query.token,function(response) {
    console.log (response);
    res = header.setHeaders(res, __HTTP_SUCCESS__);
    res.end(response);
  });
})

var server = app.listen(8081, function () {
   console.log("Example app listening at http on tcp/8081")
})

function handleError(res, error) {
  zlib.gzip(error, function (_, result){
    res.end(result);
  });
}

function httpPost(apiFilter, req, res, token, callback) {
  var properties = propertiesreader(process.env.APP_PROPERTIES);
  var envType = process.env.RUNTIME_ENV_TYPE;
  var __HTTP_SUCCESS__ = Number(properties.get('global_HTTP_CREATED_SUCCESS'));
  var __CACHE_TIMEOUT__ = Number(properties.get(apiFilter + '_CACHE_TIMEOUT'));
  var __HTTP_SERVICE_NOT_FOUND__ = Number(properties.get('global_HTTP_SERVICE_NOT_FOUND'));
  var __HTTP_UNABLE_TO_CONNECT__ = Number(properties.get('global_HTTP_SERVICE_NOT_FOUND'));
  var __HTTP_DATA_NOT_FOUND__ = Number(properties.get('global_HTTP_DATA_NOT_FOUND'));
  var __HTTP_CONNECTION_REFUSED__ = Number(properties.get('global_HTTP_CONNECTION_REFUSED'));
  var __HTTP_NOT_FOUND__ = Number(properties.get('global_HTTP_NOT_FOUND'));
  var __USERNAME__ = properties.get(apiFilter + '_user');
  var __PASSWORD__ = properties.get(apiFilter + '_password');
  var __SOURCE_URL__ = req.protocol + "://" + req.get('host') + req.originalUrl;
  var jenkinsResponse = [];

  //parse incoming body from github webhook
  var parseJenkinsBody = JSON.parse(JSONIFY(req.body))
  var parseJenkinsBodyModifiedLength = parseJenkinsBody.commits[0].modified.length;

  //list projects that have modified files during github checkin
  var projectNameArr = [];
  for(var i = 0; i < parseJenkinsBodyModifiedLength; i++) {
    var projectNameItem = parseJenkinsBody.commits[0].modified[i];
    var projectName = projectNameItem.substr(0, projectNameItem.indexOf("/"));
    projectNameArr.push(projectName);
  }

  //get unique project names from the above list
  var uniqueProjectName = new Set(projectNameArr);
  var jenkinsJobCount = 0;
  console.log([...uniqueProjectName]);

  //For each unique project name call the jenkins build and deploy job
  const projectNameUniqueArr = [...uniqueProjectName];
  for(var i = 0; i < projectNameUniqueArr.length; i++) {
    apiFilterValue = projectNameUniqueArr[i];
    var __TARGET_URL__ = properties.get(apiFilter + '_' + envType + '_endpoint').replace(properties.get(apiFilter + '_replaceString'), apiFilterValue).replace(properties.get(apiFilter + '_replaceTokenString'), token);

    request.post({
      url: __TARGET_URL__,
      headers: {
        'Content-Type': 'application/json',
      },
      gzip: true
    }, function(error, response, body) {
      if (!error && response.statusCode == __HTTP_SUCCESS__) {
        var jenkinsResult = {
          job_name: String(projectNameUniqueArr[jenkinsJobCount]),
          job_result: __HTTP_SUCCESS__,
        }
      }else {
        console.log("Error msg: " + error);
        console.log("Error code: " + response.statusCode);
        if(error != null && error.toString().includes(properties.get('HTTP_CONNECTION_REFUSED_Error_Message'))){
          var jenkinsResult = {
            job_name: String(projectNameUniqueArr[jenkinsJobCount]),
            job_result: __HTTP_CONNECTION_REFUSED__,
          }
        }else{
          var jenkinsResult = {
            job_name: String(projectNameUniqueArr[jenkinsJobCount]),
            job_result: response.statusCode,
          }
        }
      }
      jenkinsResponse.push(jenkinsResult);
      jenkinsJobCount++;
      if(jenkinsJobCount == projectNameUniqueArr.length){
        callback(JSONIFY(jenkinsResponse));
      }
    });
  }
}
