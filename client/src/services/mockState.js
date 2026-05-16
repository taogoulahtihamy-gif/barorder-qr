let _usingMock = false;
const _listeners = new Set();

const DEMO_FLAG_KEY = 'demoMode';

function readDemoFlag() {
  try { return localStorage.getItem(DEMO_FLAG_KEY) === 'true'; } catch { return false; }
}

function writeDemoFlag(val) {
  try {
    if (val) localStorage.setItem(DEMO_FLAG_KEY, 'true');
    else localStorage.removeItem(DEMO_FLAG_KEY);
  } catch { }
}

export function setUsingMock(val) {
  _usingMock = val;
  writeDemoFlag(val);
  _listeners.forEach(fn => fn(val));
}

export function isUsingMock() {
  _usingMock = _usingMock || readDemoFlag();
  return _usingMock;
}

export function onMockChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
