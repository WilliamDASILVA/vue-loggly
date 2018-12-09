"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var VueLoggly = {};

VueLoggly.install = function (Vue, opts) {
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  }

  var CONSTANTS = {
    LOGGLY_INPUT_PREFIX: 'http' + ((typeof document !== 'undefined' && document.location.protocol) === 'https:' ? 's' : '') + '://',
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
        var _onerror = window.onerror; // send console error messages to Loggly

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
    if (typeof window !== 'undefined' && tracker.useDomainProxy === true) {
      tracker.inputUrl = "".concat(CONSTANTS.LOGGLY_INPUT_PREFIX).concat(window.location.host, "/").concat(CONSTANTS.LOGGLY_PROXY_DOMAIN, "/inputs/").concat(tracker.key, "/tag/").concat(tracker.tag);
    } else {
      tracker.inputUrl = "".concat(CONSTANTS.LOGGLY_INPUT_PREFIX).concat(tracker.logglyCollectorDomain || CONSTANTS.LOGGLY_COLLECTOR_DOMAIN, "/inputs/").concat(tracker.key, "/tag/").concat(tracker.tag);
    }
  }

  var LogglyTracker =
  /*#__PURE__*/
  function () {
    function LogglyTracker() {
      _classCallCheck(this, LogglyTracker);
    }

    _createClass(LogglyTracker, [{
      key: "setSession",
      value: function setSession(sessionId) {
        if (sessionId) {
          this.session_id = sessionId;
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
      key: "push",
      value: function push(data) {
        var type = _typeof(data);

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
      key: "track",
      value: function track(data) {
        // inject session id
        data.sessionId = this.session_id;

        if (typeof window !== 'undefined') {
          try {
            // creating an asynchronous XMLHttpRequest
            var xmlHttp = new window.XMLHttpRequest();
            xmlHttp.open('POST', this.inputUrl, true); // true for asynchronous request

            xmlHttp.setRequestHeader('Content-Type', 'text/plain');
            xmlHttp.send(JSON.stringify(data));
          } catch (ex) {
            if (window && window.console && typeof window.console.log === 'function') {
              console.log('Failed to log to loggly because of this exception:\n' + ex);
              console.log('Failed log data:', data);
            }
          }
        }
      }
    }, {
      key: "readCookie",
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
            var end = cookie.indexOf('', i + 1);
            end = end < 0 ? cookie.length : end;
            return cookie.slice(i + CONSTANTS.LOGGLY_SESSION_KEY.length + 1, end);
          }
        }
      }
    }, {
      key: "setCookie",
      value: function setCookie(value) {
        if (typeof document !== 'undefined') {
          document.cookie = CONSTANTS.LOGGLY_SESSION_KEY + '=' + value;
        }
      }
    }]);

    return LogglyTracker;
  }();

  var existing = typeof window !== 'undefined' && window._LTracker || [];
  var tracker = new LogglyTracker();

  if (existing && existing.length) {
    existing.forEach(function (e) {
      tracker.push(e);
    });
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

  function _loggly(tracking) {
    if (tracking) {
      tracker.push(tracking);
    }
  }

  Vue.prototype.$loggly = _loggly;
  Vue.loggly = _loggly;
};

var _default = VueLoggly;
exports.default = _default;