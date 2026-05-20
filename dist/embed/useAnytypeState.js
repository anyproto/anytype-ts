// Anytype Mini App runtime hook — useAnytypeState.
//
// Place this file next to react.js and react-dom.js at the embed's base path
// (the mini-app authoring tool auto-injects a <script src="./useAnytypeState.js">
// tag, same convention as the React UMD scripts).
//
// Shape: identical to React.useState — [state, setState] pair. The difference
// is persistence: values pushed via setState go through window.__ANYTYPE_API__
// and come back as an 'anytype:state' event, which the hook catches to update
// local state on echo. Author code never needs to touch __ANYTYPE_STATE__ or
// __ANYTYPE_API__ directly.
//
// Pessimistic flow: the outbound path does NOT call the local setter — it
// pushes to Anytype and waits for the echo to update local state. This avoids
// echo-loops on the inbound side.

(function () {
  if (typeof window === "undefined" || typeof React === "undefined") return;

  window.useAnytypeState = function (initial) {
    var s = React.useState(function () {
      return window.__ANYTYPE_STATE__ || initial;
    });
    var state = s[0], setLocal = s[1];

    React.useEffect(function () {
      function on (e) { setLocal(e.detail || {}); }
      window.addEventListener("anytype:state", on);
      return function () { window.removeEventListener("anytype:state", on); };
    }, []);

    return [state, function (next) {
      var resolved = typeof next === "function" ? next(state) : next;
      window.__ANYTYPE_API__.setState(resolved);
    }];
  };
})();
