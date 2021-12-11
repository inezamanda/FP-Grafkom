var createPacman = (function () {
  // buletannya akan mengecil secara horizontal kalau mati
  var pacmanGeometries = [];
  var numFrames = 40;
  var offset;
  // memotong pacman secara bertahap (horizontal)
  for (var i = 0; i < numFrames; i++) {
    offset = (i / (numFrames - 1)) * Math.PI;
    pacmanGeometries.push(
      new THREE.SphereGeometry(
        PACMAN_RADIUS,
        16,
        16,
        offset,
        Math.PI * 2 - offset * 2
      )
    );
    pacmanGeometries[i].rotateX(Math.PI / 2);
  }

  // objek pacman
  var pacmanMaterial = new THREE.MeshPhongMaterial({
    color: "yellow",
    side: THREE.DoubleSide,
  });

  return function (scene, position) {
    var pacman = new THREE.Mesh(pacmanGeometries[0], pacmanMaterial);
    pacman.frames = pacmanGeometries;
    pacman.currentFrame = 0;

    pacman.isPacman = true;
    pacman.isWrapper = true;
    pacman.atePellet = false;
    pacman.distanceMoved = 0;

    // Initialize pacman facing to the left.
    pacman.position.copy(position);
    pacman.direction = new THREE.Vector3(-1, 0, 0);

    scene.add(pacman);

    return pacman;
  };
})();
