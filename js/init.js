function createRenderer() {
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xffe3fe, 1.0); // set area colour to peach pink
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  return renderer;
}

function createScene() {
  var scene = new THREE.Scene();

  // Add lighting
  scene.add(new THREE.AmbientLight(0x888888)); // light 1
  var light = new THREE.SpotLight("white", 0.5); // light 2
  light.position.set(0, 0, 50); // light 2 position
  scene.add(light);

  return scene;
}

// Mini map camera
function createHudCamera(map) {
  var width = map.right - map.left,
    height = map.top - map.bottom;

  var hudCamera = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    1,
    100
  );
  // place camera on z-coord = 10
  hudCamera.position.copy(new THREE.Vector3(map.centerX, map.centerY, 10));
  hudCamera.lookAt(new THREE.Vector3(map.centerX, map.centerY, 0));

  return hudCamera;
}

function renderHud(renderer, hudCamera, scene) {
  // Increase size of pacman and dots in HUD to make them easier to see.
  scene.children.forEach(function (object) {
    if (object.isWall !== true) object.scale.set(2.5, 2.5, 2.5);
  });

  // Render on the bottom left with width 200x200
  renderer.setScissorTest(true);
  renderer.setScissor(10, 10, 200, 200);
  renderer.setViewport(10, 10, 200, 200);
  renderer.render(scene, hudCamera);
  renderer.setScissorTest(false);

  // Reset scales after rendering HUD.
  scene.children.forEach(function (object) {
    object.scale.set(1, 1, 1);
  });
}

// Returns an object that contains the current state of keys being pressed.
function createKeyState() {
  // Keep track of current keys being pressed.
  var keyState = {};

  document.body.addEventListener("keydown", function (event) {
    keyState[event.keyCode] = true;
    keyState[String.fromCharCode(event.keyCode)] = true;
  });
  document.body.addEventListener("keyup", function (event) {
    keyState[event.keyCode] = false;
    keyState[String.fromCharCode(event.keyCode)] = false;
  });
  document.body.addEventListener("blur", function (event) {
    // Make it so that all keys are unpressed when the browser loses focus.
    for (var key in keyState) {
      if (keyState.hasOwnProperty(key)) keyState[key] = false;
    }
  });

  return keyState;
}

function animationLoop(callback, requestFrameFunction) {
  requestFrameFunction = requestFrameFunction || requestAnimationFrame;

  var previousFrameTime = window.performance.now();

  // How many seconds the animation has progressed in total.
  var animationSeconds = 0;

  function render() {
    var now = window.performance.now();
    var animationDelta = (now - previousFrameTime) / 1000;
    previousFrameTime = now;

    // requestAnimationFrame will not call the callback if the browser
    // isn't visible, so if the browser has lost focus for a while the
    // time since the last frame might be very large. This could cause
    // strange behavior (such as objects teleporting through walls in
    // one frame when they would normally move slowly toward the wall
    // over several frames), so make sure that the delta is never too
    // large.
    animationDelta = Math.min(animationDelta, 1 / 30);

    // Keep track of how many seconds of animation has passed.
    animationSeconds += animationDelta;

    callback(animationDelta, animationSeconds);

    requestFrameFunction(render);
  }

  requestFrameFunction(render);
}
