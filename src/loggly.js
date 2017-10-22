import axios from 'axios';

import { uuid } from './misc';

const CONSTANTS = {
  LOGGLY_INPUT_PREFIX: 'http' + (('https:' === document.location.protocol ? 's' : '')) + '://',
  LOGGLY_COLLECTOR_DOMAIN: 'logs-01.loggly.com',
  LOGGLY_SESSION_KEY: 'logglytrackingsession',
  LOGGLY_SESSION_KEY_LENGTH: this.LOGGLY_SESSION_KEY.length + 1,
  LOGGLY_PROXY_DOMAIN: 'loggly',
};

// function LogglyTracker() {
// this.key = false;
// this.sendConsoleErrors = false;
// this.tag = 'jslogger';
// this.useDomainProxy = false;
// }

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
  if (typeof window !== 'undefined') {
    tracker.sendConsoleErrors = sendConsoleErrors;
  
    if (tracker.sendConsoleErrors === true) {
      let _onerror = window.onerror;
      //send console error messages to Loggly
      window.onerror = (msg, url, line, col, err) => {
        tracker.push({ 
          category: 'BrowserJsException',
          exception: {
            message: msg,
            url: url,
            lineno: line,
            colno: col,
            stack: err ? err.stack : 'n/a',
          }
        });
  
        if (_onerror && typeof _onerror === 'function') {
          _onerror.apply(window, arguments);
        }
      };
    }
  }
}

function setInputUrl(tracker) {
  if (tracker.useDomainProxy == true) {
    tracker.inputUrl = CONSTANTS.LOGGLY_INPUT_PREFIX
      + window.location.host
      + '/'
      + LOGGLY_PROXY_DOMAIN
      + '/inputs/'
      + tracker.key
      + '/tag/'
      + tracker.tag;
  } else {
    tracker.inputUrl = CONSTANTS.LOGGLY_INPUT_PREFIX
      + (tracker.logglyCollectorDomain || CONSTANTS.LOGGLY_COLLECTOR_DOMAIN)
      + '/inputs/'
      + tracker.key
      + '/tag/'
      + tracker.tag;
  }
}

export class LogglyTracker{
  setSession(session_id) {
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
  push(data) {
    const type = typeof data;
    const self = this;

    if (!data || !(type === 'object' || type === 'string')) {
      return;
    }

    if (type === 'string') {
      data = {
        text: data,
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
  track(data) {
    // inject session id
    data.sessionId = this.session_id;

    axios.post(this.inputUrl, data)
    .catch((err) => {
      if (window && window.console && window.console.log) {
        console.log('Failed to log to loggy because of this error: ', err);
      }
    });
  }
  readCookie() {
    let cookie = null;
    let i = null;
    if (typeof document !== 'undefined') {
      cookie = document.cookie;
      i = cookie.indexOf(CONSTANTS.LOGGLY_SESSION_KEY);
    }
    if (cookie) {
      if (i !== null && i < 0) {
        return false;
      } else {
        let end = cookie.indexOf(';', i + 1);
        end = end < 0 ? cookie.length : end;
        return cookie.slice(i + CONSTANTS.LOGGLY_SESSION_KEY_LENGTH, end);
      }
    }
  }
  setCookie(value) {
    if (typeof document !== 'undefined') {
      document.cookie = CONSTANTS.LOGGLY_SESSION_KEY + '=' + value;
    }
  }
};

const existing = typeof window !== 'undefined' && window._LTracker || [];
const tracker = new LogglyTracker();

if (existing && existing.length) {
  let eLength = existing.length;
  for (let i = 0; i < eLength; i++) {
    tracker.push(existing[i]);
  }
}

