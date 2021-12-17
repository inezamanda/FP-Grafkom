import { GLTFLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/DRACOLoader.js";

function createScene() {
  var scene = new THREE.Scene();

  // Add lighting
  scene.add(new THREE.AmbientLight(0x888888)); // light 1
  var light = new THREE.SpotLight("white", 0.5); // light 2
  light.position.set(0, 0, 50); // light 2 position
  scene.add(light);

  return scene;
}

function main() {
  // Game-state variables
  var keys = createKeyState();
  var renderer = createRenderer();
  var scene = createScene();
  var map = createMap(scene, LEVEL);
  var numDotsEaten = 0;
  var isGameover = false;

  // skybox setup
  const path = "../assets/object/anime_starry_night/scene.gltf";
  {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    loader.setDRACOLoader(dracoLoader);

    var hea = loader.load(path, (gltf) => {
      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          child.geometry.center(); // center here
        }
      });
      gltf.scene.castShadow = true;
      gltf.scene.receiveShadow = true;
      gltf.scene.rotation.x = Math.PI / 2;
      gltf.scene.rotation.y = Math.PI / 2;
      gltf.scene.position.set(0, 0, -350);
      var heaObj = gltf.scene;
      scene.add(heaObj);
    });
  }

  createPlane(scene, map);

  // set camera
  var camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.up.copy(UP);
  camera.targetPosition = new THREE.Vector3();
  camera.targetLookAt = new THREE.Vector3();
  camera.lookAtPosition = new THREE.Vector3();
  var hudCamera = createHudCamera(map);

  var pacman = createPacman(scene, map.pacmanSpawn);

  var ghostSpawnTime = -8;
  var numGhosts = 0;

  var won = false;
  var lost = false;
  var lostTime, wonTime;

  var deathPosition = new THREE.Vector3();

  // SET AUDIO
  // eating sound
  var chompSound = new Audio("./audio/mixkit-quick-jump-arcade-game-239.wav");
  chompSound.volume = 0.5;
  chompSound.loop = true;
  chompSound.preload = "auto";
  // start game sound
  var levelStartSound = new Audio("./audio/mixkit-arcade-rising-231.wav");
  levelStartSound.preload = "auto";
  // Play the level start sound as soon as the game starts.
  levelStartSound.autoplay = true;
  // death sound
  var soundGameOver = new Audio("./audio/mixkit-horror-lose-2028.wav");
  soundGameOver.preload = "auto";
  // eat ghost sound
  var killSound = new Audio(
    "./audio/mixkit-video-game-health-recharge-2837.wav"
  );
  killSound.preload = "auto";

  var deathSound = new Audio("./audio/mixkit-fairytale-game-over-1945.wav");
  deathSound.preload = "auto";

  var palletPowerSound = new Audio(
    "./audio/mixkit-bonus-extra-in-a-video-game-2064.wav"
  );
  palletPowerSound.preload = "auto";

  var winSound = new Audio("./audio/mixkit-video-game-win-2016.wav");
  winSound.preload = "auto";

  var remove = [];
  var active = false;

  // Create life images
  var lives = 1;
  var livesContainer = document.getElementById("lives");
  for (var i = 0; i < lives; i++) {
    var life = document.createElement("img");
    life.src = "../assets/image/pacman.png";
    life.className = "life";

    livesContainer.appendChild(life);
  }

  // Main game logic
  var update = function (delta, now) {
    if (keys[27]) {
      pauseState();
    }

    if (isGameover) {
      isGameover = false;
      gameoverState();
    }
    updatePacman(delta, now);

    updateCamera(delta, now);

    scene.children.forEach(function (object) {
      if (object.isGhost === true) updateGhost(object, delta, now);
      if (object.isWrapper === true) wrapObject(object, map);
      if (object.isTemporary === true && now > object.removeAfter)
        remove.push(object);
    });

    // Cannot remove items from scene.children while iterating
    // through it, so remove them after the forEach loop.
    remove.forEach(scene.remove, scene);
    for (var item in remove) {
      if (remove.hasOwnProperty(item)) {
        scene.remove(remove[item]);
        delete remove[item];
      }
    }

    // Spawn a ghost every 8 seconds, up to 4 ghosts.
    if (numGhosts < 5 && now - ghostSpawnTime > 10) {
      createGhost(scene, map.ghostSpawn);
      numGhosts += 1;
      ghostSpawnTime = now;
    }
  };

  var showText = function (message, size, now) {
    var textMaterial = new THREE.MeshPhongMaterial({ color: "white" });

    const loader = new THREE.FontLoader();
    loader.load(
      "../assets/font/helvetiker_regular.typeface.js",
      function (font) {
        // Show 3D text banner.
        var textGeometry = new THREE.TextGeometry(message, {
          size: size,
          height: 0.05,
          font: font,
        });

        var text = new THREE.Mesh(textGeometry, textMaterial);

        // Position text just above pacman.
        text.position.copy(pacman.position).add(UP);

        // Rotate text so that it faces same direction as pacman.
        text.up.copy(pacman.direction);
        text.lookAt(text.position.clone().add(UP));

        // Remove after 3 seconds.
        text.isTemporary = true;
        text.removeAfter = now + 3;

        scene.add(text);
        return text;
      }
    );
  };

  var updatePacman = function (delta, now) {
    // Play chomp sound if player is moving.
    if (!won && !lost && (keys["W"] || keys["S"])) {
      chompSound.play();
    } else {
      chompSound.pause();
    }

    // Move if we haven't died or won.
    if (!won && !lost) {
      movePacman(delta);
    }

    // Check for win.
    if (!won && numDotsEaten === map.numDots) {
      won = true;
      wonTime = now;

      var text = showText("You won =D", 1, now);

      winSound.play();
    }

    // Go to next level 4 seconds after winning.
    if (won && now - wonTime > 3) {
      // Reset pacman position and direction.
      pacman.position.copy(map.pacmanSpawn);
      pacman.direction.copy(LEFT);
      pacman.distanceMoved = 0;

      // Reset dots, power pellets, and ghosts.
      scene.children.forEach(function (object) {
        if (object.isDot === true || object.isPowerPellet === true)
          object.visible = true;
        if (object.isGhost === true) remove.push(object);
      });

      // Increase speed.
      PACMAN_SPEED += 1;
      GHOST_SPEED += 1;

      won = false;
      numDotsEaten = 0;
      numGhosts = 0;
    }

    // Reset pacman 4 seconds after dying.
    if (lives > 0 && lost && now - lostTime > 4) {
      lost = false;
      pacman.position.copy(deathPosition);
      pacman.direction.copy(LEFT);
      pacman.distanceMoved = 0;
    }

    // Animate model
    if (lost) {
      // If pacman got eaten, show dying animation.
      var angle = ((now - lostTime) * Math.PI) / 2;
      var frame = Math.min(
        pacman.frames.length - 1,
        Math.floor((angle / Math.PI) * pacman.frames.length)
      );

      pacman.geometry = pacman.frames[frame];
    } else {
      // Otherwise, show eating animation based on how much pacman has moved.
      var maxAngle = Math.PI / 4;
      var angle = (pacman.distanceMoved * 2) % (maxAngle * 2);
      if (angle > maxAngle) angle = maxAngle * 2 - angle;
      var frame = Math.floor((angle / Math.PI) * pacman.frames.length);

      pacman.geometry = pacman.frames[frame];
    }
  };

  var _lookAt = new THREE.Vector3();
  var movePacman = function (delta) {
    // Update rotation based on direction so that mouth is always facing forward.
    // The "mouth" part is on the side of the sphere, make it "look" up but
    // set the up direction so that it points forward.
    pacman.up.copy(pacman.direction).applyAxisAngle(UP, -Math.PI / 2);
    pacman.lookAt(_lookAt.copy(pacman.position).add(UP));
    if (keys["W"]) {
      // W - move forward
      //pacman.translateOnAxis(pacman.direction, PACMAN_SPEED * delta);
      // Because we are rotating the object above using lookAt, "forward" is to the left.
      pacman.translateOnAxis(LEFT, PACMAN_SPEED * delta);
      pacman.distanceMoved += PACMAN_SPEED * delta;
    }
    if (keys["W"] && keys["L"]) {
      // L - speedmoved
      //pacman.translateOnAxis(pacman.direction, -PACMAN_SPEED * delta);
      pacman.translateOnAxis(LEFT, PACMAN_SPEED * delta * 1);
      pacman.distanceMoved += PACMAN_SPEED * delta * 1;
    }
    if (keys["A"]) {
      // A - rotate left
      pacman.direction.applyAxisAngle(UP, (Math.PI / 2) * delta);
    }
    if (keys["D"]) {
      // D - rotate right
      pacman.direction.applyAxisAngle(UP, (-Math.PI / 2) * delta);
    }
    if (keys["S"]) {
      // S - move backward
      //pacman.translateOnAxis(pacman.direction, -PACMAN_SPEED * delta);
      pacman.translateOnAxis(LEFT, -PACMAN_SPEED * delta);
      pacman.distanceMoved += PACMAN_SPEED * delta;
    }
    if (keys["S"] && keys["L"]) {
      // L - speedmoved
      //pacman.translateOnAxis(pacman.direction, -PACMAN_SPEED * delta);
      pacman.translateOnAxis(LEFT, -PACMAN_SPEED * delta * 1);
      pacman.distanceMoved += PACMAN_SPEED * delta * 1;
    }

    // Check for collision with walls.
    var leftSide = pacman.position
      .clone()
      .addScaledVector(LEFT, PACMAN_RADIUS)
      .round();
    var topSide = pacman.position
      .clone()
      .addScaledVector(TOP, PACMAN_RADIUS)
      .round();
    var rightSide = pacman.position
      .clone()
      .addScaledVector(RIGHT, PACMAN_RADIUS)
      .round();
    var bottomSide = pacman.position
      .clone()
      .addScaledVector(BOTTOM, PACMAN_RADIUS)
      .round();
    if (isWall(map, leftSide)) {
      pacman.position.x = leftSide.x + 0.5 + PACMAN_RADIUS;
    }
    if (isWall(map, rightSide)) {
      pacman.position.x = rightSide.x - 0.5 - PACMAN_RADIUS;
    }
    if (isWall(map, topSide)) {
      pacman.position.y = topSide.y - 0.5 - PACMAN_RADIUS;
    }
    if (isWall(map, bottomSide)) {
      pacman.position.y = bottomSide.y + 0.5 + PACMAN_RADIUS;
    }

    var cell = getAt(map, pacman.position);

    // Make pacman eat dots.
    if (cell && cell.isDot === true && cell.visible === true) {
      removeAt(map, scene, pacman.position);
      numDotsEaten += 1;
    }

    // make pacman eat hea
    if (cell && cell.isHea === true && cell.visible === true) {
      removeAt(map, scene, pacman.position);
      lives += 1;
      for (var i = lives; i <= lives; i++) {
        var life = document.createElement("img");
        life.src = "../assets/image/pacman.png";
        life.className = "life";

        livesContainer.appendChild(life);
      }
      killSound.play();
    }

    // Make pacman eat power pellets.
    pacman.atePellet = false;
    if (cell && cell.isPowerPellet === true && cell.visible === true) {
      removeAt(map, scene, pacman.position);
      pacman.atePellet = true;
      palletPowerSound.play();
    }
  };

  var updateCamera = function (delta, now) {
    if (won) {
      // After winning, pan camera out to show whole level.
      camera.targetPosition.set(map.centerX, map.centerY, 30);
      camera.targetLookAt.set(map.centerX, map.centerY, 0);
    } else if (lost) {
      // After losing, move camera to look down at pacman's body from above.
      camera.targetPosition = pacman.position.clone().addScaledVector(UP, 4);
      camera.targetLookAt = pacman.position
        .clone()
        .addScaledVector(pacman.direction, 0.01);
    } else {
      // Place camera above and behind pacman, looking towards direction of pacman.
      camera.targetPosition
        .copy(pacman.position)
        .addScaledVector(UP, 0.6)
        .addScaledVector(pacman.direction, -1);
      camera.targetLookAt.copy(pacman.position).add(pacman.direction);
    }

    // Move camera slowly during win/lose animations.
    var cameraSpeed = lost || won ? 1 : 10;
    camera.position.lerp(camera.targetPosition, delta * cameraSpeed);
    camera.lookAtPosition.lerp(camera.targetLookAt, delta * cameraSpeed);
    camera.lookAt(camera.lookAtPosition);
  };

  var updateGhost = function (ghost, delta, now) {
    // Make all ghosts afraid if Pacman just ate a pellet.
    if (pacman.atePellet === true) {
      ghost.isAfraid = true;
      ghost.becameAfraidTime = now;

      // kalau mau ganti objek sabi
      ghost.material.color.setStyle("white");
    }

    // Make ghosts not afraid anymore after 10 seconds.
    if (ghost.isAfraid && now - ghost.becameAfraidTime > 10) {
      ghost.isAfraid = false;

      ghost.material.color.setStyle("red");
    }

    moveGhost(ghost, delta);

    // Check for collision between Pacman and ghost.
    if (
      !lost &&
      !won &&
      distance(pacman, ghost) < PACMAN_RADIUS + GHOST_RADIUS
    ) {
      if (ghost.isAfraid === true) {
        remove.push(ghost);
        numGhosts -= 1;

        killSound.play();
      } else {
        lives -= 1;
        // Unshow life
        const liveGone = document.getElementsByClassName("life")[lives];
        document.getElementsByClassName("life")[lives].style.display = "none";
        liveGone.parentNode.removeChild(liveGone);

        if (lives > 0) {
          showText("You died =(", 0.1, now);
          deathSound.play();
        } else {
          showText("Game over =(", 0.1, now);
          // show window gameover trus button restart
          // setTimeout(gameOver(), 1200);
          deathSound.play();
          isGameover = true;
        }

        lost = true;
        deathPosition = pacman.position;
        // deathDirection = pacman.direction;
        lostTime = now;
      }
    }
  };

  var moveGhost = (function () {
    var previousPosition = new THREE.Vector3();
    var currentPosition = new THREE.Vector3();
    var leftTurn = new THREE.Vector3();
    var rightTurn = new THREE.Vector3();

    return function (ghost, delta) {
      previousPosition
        .copy(ghost.position)
        .addScaledVector(ghost.direction, 0.5)
        .round();
      ghost.translateOnAxis(ghost.direction, delta * GHOST_SPEED);
      currentPosition
        .copy(ghost.position)
        .addScaledVector(ghost.direction, 0.5)
        .round();

      // If the ghost is transitioning from one cell to the next, see if they can turn.
      if (!currentPosition.equals(previousPosition)) {
        // left and right turn of next cell of ghost current position
        leftTurn.copy(ghost.direction).applyAxisAngle(UP, Math.PI / 2);
        rightTurn.copy(ghost.direction).applyAxisAngle(UP, -Math.PI / 2);

        var forwardWall = isWall(map, currentPosition);
        // check left side of ghost in current cell
        var leftWall = isWall(
          map,
          currentPosition.copy(ghost.position).add(leftTurn)
        );
        // check right side of ghost in current cell
        var rightWall = isWall(
          map,
          currentPosition.copy(ghost.position).add(rightTurn)
        );

        if (!leftWall || !rightWall) {
          // If the ghost can turn, randomly choose one of the possible turns.
          var possibleTurns = [];
          if (!forwardWall) possibleTurns.push(ghost.direction);
          if (!leftWall) possibleTurns.push(leftTurn);
          if (!rightWall) possibleTurns.push(rightTurn);

          if (possibleTurns.length === 0) throw new Error("A ghost got stuck!");

          var newDirection =
            possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
          ghost.direction.copy(newDirection);

          // Snap ghost to center of current cell and start moving in new direction.
          ghost.position.round().addScaledVector(ghost.direction, delta);
        }
      }
    };
  })();

  function animationLoop(callback, requestFrameFunction) {
    requestFrameFunction = requestFrameFunction || requestAnimationFrame;

    var previousFrameTime = window.performance.now();

    // How many seconds the animation has progressed in total.
    var animationSeconds = 0;

    function render() {
      if (GAME_STATE == "START") {
        heaArr.forEach((hea) => {
          // console.log(hea);
          const time = Date.now() * 0.0005;
          hea.rotation.y += 0.01;
          hea.position.z += Math.sin(time * 10) * 0.004;
        });

        var now = window.performance.now();
        var animationDelta = (now - previousFrameTime) / 1000;
        previousFrameTime = now;

        animationDelta = Math.min(animationDelta, 1 / 30);

        // Keep track of how many seconds of animation has passed.
        animationSeconds += animationDelta;

        callback(animationDelta, animationSeconds);
        requestFrameFunction(render);
      }
    }
    render();
  }
  
  // Main game loop
  animationLoop(function (delta, now) {
    update(delta, now);

    // Render main view
    renderer.setViewport(
      0,
      0,
      renderer.domElement.width,
      renderer.domElement.height
    );
    renderer.render(scene, camera);

    // Render HUD
    renderHud(renderer, hudCamera, scene);
  });

  function restart() {
    location.reload();
  }

  function pauseState() {
    var dialog = document.getElementById("help-dialog");
    dialog.style.display = "block";
    GAME_STATE = "LOOSE";
  }

  function gameoverState() {
    var dialog = document.getElementById("gameover-dialog");
    dialog.style.display = "block";
  }

  function continueState() {
    var dialog = document.getElementById("help-dialog");
    dialog.style.display = "none";
    GAME_STATE = "START";
    animationLoop(function (delta, now) {
      update(delta, now);

      // Render main view
      renderer.setViewport(
        0,
        0,
        renderer.domElement.width,
        renderer.domElement.height
      );
      renderer.render(scene, camera);

      // Render HUD
      renderHud(renderer, hudCamera, scene);
    });
  }

  const helpBtn = document.querySelector("#help-button");
  const closeHelpBtn = document.querySelector("#close-help-button");
  helpBtn.addEventListener("click", function () {
    pauseState();
  });
  closeHelpBtn.addEventListener("click", function () {
    continueState();
  });

  const gameoverBtn = document.querySelector("#gameover-button");
  gameoverBtn.addEventListener("click", function () {
    restart();
  });
}

main();
