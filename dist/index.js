'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var VueLoggly = {};
VueLoggly.install = function (Vue, opts) {
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c == 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  }

  var CONSTANTS = {
    LOGGLY_INPUT_PREFIX: 'http' + ('https:' === (typeof document !== 'undefined' && document.location.protocol) ? 's' : '') + '://',
    LOGGLY_COLLECTOR_DOMAIN: 'logs-01.loggly.com',
    LOGGLY_SESSION_KEY: 'logglytrackingsession',
    LOGGLY_PROXY_DOMAIN: 'loggly'
  };

  function setKey(tracker, key) {
    tracker.key = key;
    tracker.setSession();
    setInputUrl(tracker);
  }

  function setTag(tracker, tag) {
    tracker.tag = tag;
  }

  function setDomainProxy(tracker, useDomainProxy) {
    tracker.useDomainProxy = useDomainProxy;
    setInputUrl(tracker);
  }

  function setSendConsoleError(tracker, sendConsoleErrors) {
    var _arguments = arguments;

    if (typeof window !== 'undefined') {
      tracker.sendConsoleErrors = sendConsoleErrors;

      if (tracker.sendConsoleErrors === true) {
        var _onerror = window.onerror;
        //send console error messages to Loggly
        window.onerror = function (msg, url, line, col, err) {
          tracker.push({
            category: 'BrowserJsException',
            exception: {
              message: msg,
              url: url,
              lineno: line,
              colno: col,
              stack: err ? err.stack : 'n/a'
            }
          });

          if (_onerror && typeof _onerror === 'function') {
            _onerror.apply(window, _arguments);
          }
        };
      }
    }
  }

  function setInputUrl(tracker) {
    if (typeof window !== 'undefined' && tracker.useDomainProxy == true) {
      tracker.inputUrl = CONSTANTS.LOGGLY_INPUT_PREFIX + window.location.host + '/' + LOGGLY_PROXY_DOMAIN + '/inputs/' + tracker.key + '/tag/' + tracker.tag;
    } else {
      tracker.inputUrl = CONSTANTS.LOGGLY_INPUT_PREFIX + (tracker.logglyCollectorDomain || CONSTANTS.LOGGLY_COLLECTOR_DOMAIN) + '/inputs/' + tracker.key + '/tag/' + tracker.tag;
    }
  }

  var LogglyTracker = function () {
    function LogglyTracker() {
      _classCallCheck(this, LogglyTracker);
    }

    _createClass(LogglyTracker, [{
      key: 'setSession',
      value: function setSession(session_id) {
        if (session_id) {
          this.session_id = session_id;
          this.setCookie(this.session_id);
        } else if (!this.session_id) {
          this.session_id = this.readCookie();
          if (!this.session_id) {
            this.session_id = uuid();
            this.setCookie(this.session_id);
          }
        }
      }
    }, {
      key: 'push',
      value: function push(data) {
        var type = typeof data === 'undefined' ? 'undefined' : _typeof(data);
        var self = this;

        if (!data || !(type === 'object' || type === 'string')) {
          return;
        }

        if (type === 'string') {
          data = {
            text: data
          };
        } else {
          if (data.logglyCollectorDomain) {
            self.logglyCollectorDomain = data.logglyCollectorDomain;
            return;
          }

          if (data.sendConsoleErrors !== undefined) {
            setSendConsoleError(self, data.sendConsoleErrors);
          }

          if (data.tag) {
            setTag(self, data.tag);
          }

          if (data.useDomainProxy) {
            setDomainProxy(self, data.useDomainProxy);
          }

          if (data.logglyKey) {
            setKey(self, data.logglyKey);
            return;
          }

          if (data.session_id) {
            self.setSession(data.session_id);
            return;
          }
        }

        if (!self.key) {
          return;
        }

        self.track(data);
      }
    }, {
      key: 'track',
      value: function track(data) {
        // inject session id
        data.sessionId = this.session_id;

        if (typeof window !== 'undefined') {
          try {
            //creating an asynchronous XMLHttpRequest
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open('POST', this.inputUrl, true); //true for asynchronous request
            xmlHttp.setRequestHeader('Content-Type', 'text/plain');
            xmlHttp.send(JSON.stringify(data));
          } catch (ex) {
            if (window && window.console && typeof window.console.log === 'function') {
              console.log("Failed to log to loggly because of this exception:\n" + ex);
              console.log("Failed log data:", data);
            }
          }
        }
      }
    }, {
      key: 'readCookie',
      value: function readCookie() {
        var cookie = null;
        var i = null;
        if (typeof document !== 'undefined') {
          cookie = document.cookie;
          i = cookie.indexOf(CONSTANTS.LOGGLY_SESSION_KEY);
        }
        if (cookie) {
          if (i !== null && i < 0) {
            return false;
          } else {
            var end = cookie.indexOf(';', i + 1);
            end = end < 0 ? cookie.length : end;
            return cookie.slice(i + CONSTANTS.LOGGLY_SESSION_KEY.length + 1, end);
          }
        }
      }
    }, {
      key: 'setCookie',
      value: function setCookie(value) {
        if (typeof document !== 'undefined') {
          document.cookie = CONSTANTS.LOGGLY_SESSION_KEY + '=' + value;
        }
      }
    }]);

    return LogglyTracker;
  }();

  ;

  var existing = typeof window !== 'undefined' && window._LTracker || [];
  var tracker = new LogglyTracker();

  if (existing && existing.length) {
    var eLength = existing.length;
    for (var i = 0; i < eLength; i++) {
      tracker.push(existing[i]);
    }
  }

  var options = {
    logglyKey: null,
    sendConsoleErrors: false,
    tag: 'javascript-logs'
  };

  Object.keys(opts).forEach(function (k) {
    options[k] = opts[k];
  });

  tracker.push(options);

  Vue.prototype.$loggly = function (tracking) {
    if (tracking) {
      tracker.push(tracking);
    }
  };
};

exports.default = VueLoggly;