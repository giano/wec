/*jslint browser: true, es6: true, this: true*/
/*global requirejs */

(function () {
  'use strict';

  define(['zepto', 'socket.io', 'bluebird'],
    function ($, io, Promise) {
      // return a value that defines the module export
      // (i.e the functionality we want to expose for consumption)

      // create your module here
      const headers = {};
      headers[window.jwtTokenHeaderName] = window.jwtToken;

      const apiMountPoint = window.apiMountPoint;
      const webComponentsMountpoint = window.webComponentsMountpoint;

      const isValidUrl = function isValidUrl(str) {
        var pattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
        if (!pattern.test(str)) {
          return false;
        } else {
          return true;
        }
      };

      const getApiPath = function getApiPath(currentPath) {
        currentPath = currentPath.trim();
        if (isValidUrl(currentPath)) {
          return currentPath;
        } else {
          currentPath = currentPath.replace(/^\/|\/$/g, '');
          if(currentPath.indexOf(webComponentsMountpoint) === 0){
            return `/${currentPath}`;
          }else{
            return `/${apiMountPoint}/${currentPath}`;
          }
        }
      };

      const apiCaller = {
        get: function (path, params, options) {
          return new Promise(function (resolve, reject) {
            $.ajax({
              type: "GET",
              url: getApiPath(path),
              data: params,
              cache: false,
              headers: headers,
              success: function (data, status, xhr) {
                if (data && data.success === false) {
                  return reject(data.message);
                }
                resolve(data, status);
              },
              error: function (xhr, errorType, error) {
                reject(error, errorType);
              }
            });
          });
        },
        post: function (path, params, files) {
          return new Promise(function (resolve, reject) {
            $.ajax({
              type: "POST",
              url: getApiPath(path),
              data: params,
              cache: false,
              headers: headers,
              success: function (data, status, xhr) {
                if (data && data.success === false) {
                  return reject(data.message);
                }
                resolve(data, status);
              },
              error: function (xhr, errorType, error) {
                reject(error, errorType);
              }
            });
          });
        },
        put: function (path, params, files) {
          return new Promise(function (resolve, reject) {
            $.ajax({
              type: "PUT",
              url: getApiPath(path),
              data: params,
              cache: false,
              headers: headers,
              success: function (data, status, xhr) {
                if (data && data.success === false) {
                  return reject(data.message);
                }
                resolve(data, status);
              },
              error: function (xhr, errorType, error) {
                reject(error, errorType);
              }
            });
          });
        },
        delete: function (path, params) {
          return new Promise(function (resolve, reject) {
            $.ajax({
              type: "DELETE",
              url: getApiPath(path),
              data: params,
              cache: false,
              headers: headers,
              success: function (data, status, xhr) {
                if (data && data.success === false) {
                  return reject(data.message);
                }
                resolve(data, status);
              },
              error: function (xhr, errorType, error) {
                reject(error, errorType);
              }
            });
          });
        }
      };

      if (window) {
        window.apiCaller = window.apiCaller || apiCaller;
      }

      return apiCaller;
    });
})();
