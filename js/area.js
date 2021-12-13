// create floor
function createPlane(scene, map) {
  const loader4 = new THREE.TextureLoader();
  const planeTex = loader4.load("../assets/image/wall_floor/wall2.png");
  // const planeTex = loader4.load("./assets/paving3.png");

  var width = map.right - map.left,
    height = map.top - map.bottom;

  planeTex.wrapS = THREE.RepeatWrapping;
  planeTex.wrapT = THREE.RepeatWrapping;
  planeTex.magFilter = THREE.NearestFilter;

  planeTex.repeat.set(width + 1, height);

  const planeGeo = new THREE.PlaneGeometry(width + 1, height);
  const planeMat = new THREE.MeshPhongMaterial({
    map: planeTex,
    //   color: "white",
    wireframe: false,
  });

  const mesh = new THREE.Mesh(planeGeo, planeMat);
  mesh.receiveShadow = true;
  mesh.position.copy(new THREE.Vector3(map.centerX, map.centerY, -0.5));
  scene.add(mesh);
}

function createMap(scene, levelDefinition) {
  var map = {};
  map.bottom = -(levelDefinition.length - 1);
  map.top = 0;
  map.left = 0;
  map.right = 0;
  map.numDots = 0;
  map.pacmanSpawn = null;
  map.ghostSpawn = null;

  var x, y;
  for (var row = 0; row < levelDefinition.length; row++) {
    // Set coordinates map to match coordinate of object
    y = -row;

    map[y] = {};

    // Get the length of the longest row
    var length = Math.floor(levelDefinition[row].length / 2);
    map.right = Math.max(map.right, length);

    // Skip every second element, which is just a space for readability.
    for (var column = 0; column < levelDefinition[row].length; column += 2) {
      x = Math.floor(column / 2);

      var cell = levelDefinition[row][column];
      var object = null;

      if (cell === "#") {
        object = createWall();
      } else if (cell === ".") {
        object = createDot();
        map.numDots += 1;
      } else if (cell === "o") {
        object = createPowerPellet();
      } else if (cell === "P") {
        map.pacmanSpawn = new THREE.Vector3(x, y, 0);
      } else if (cell === "G") {
        map.ghostSpawn = new THREE.Vector3(x, y, 0);
      } else if (cell === "H") {
        object = createHea();
        map.numDots += 1;
      }

      if (object !== null) {
        object.position.set(x, y, 0);
        map[y][x] = object;
        scene.add(object);
      }
    }
  }

  map.centerX = (map.left + map.right) / 2;
  map.centerY = (map.bottom + map.top) / 2;

  return map;
}

var createWall = (function () {
  var wallGeometry = new THREE.BoxGeometry(1, 1, 1);

  const loader4 = new THREE.TextureLoader();

  // Option 1
  const wallMap = loader4.load(
    "../assets/image/hexglow_texture/Hex_glow_basecolor.png"
  );
  const wallNormal = loader4.load(
    "../assets/image/hexglow_texture/Hex_glow_normal.png"
  );
  const wallEmissive = loader4.load(
    "../assets/image/hexglow_texture/Hex_glow_emissive.png"
  );
  const wallRoughness = loader4.load(
    "../assets/image/hexglow_texture/Hex_glow_roughness.png"
  );
  const wallMetalness = loader4.load(
    "../assets/image/hexglow_texture/Hex_glow_metallic.png"
  );

  var wallMaterial = new THREE.MeshStandardMaterial({
    map: wallEmissive,
    //   emissiveMap: wallEmissive,
    metalnessMap: wallMetalness,
    roughnessMap: wallRoughness,
    normalMap: wallNormal,
  });

  // Option 2
  const wallMap2 = loader4.load("../assets/image/wall_floor/disco.jpeg");
  // Uncomment for option 2
  // var wallMaterial = new THREE.MeshStandardMaterial({
  //   map: wallMap2,
  // });

  return function () {
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.isWall = true;

    return wall;
  };
})();

// create pellet
var createDot = (function () {
  var dotGeometry = new THREE.SphereGeometry(DOT_RADIUS);
  var dotMaterial = new THREE.MeshPhongMaterial({ color: 0xffdab9 }); // Peach color

  return function () {
    var dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.isDot = true;

    return dot;
  };
})();

// create power pellet
var createPowerPellet = (function () {
  var pelletGeometry = new THREE.SphereGeometry(PELLET_RADIUS, 12, 8);
  var pelletMaterial = new THREE.MeshPhongMaterial({ color: 0xffdab9 }); // Paech color

  return function () {
    var pellet = new THREE.Mesh(pelletGeometry, pelletMaterial);
    pellet.isPowerPellet = true;

    return pellet;
  };
})();

//create health potion
var createHea = (function (isHea) {
  var shape = new THREE.Shape();
  var heaMaterial = new THREE.MeshPhongMaterial({ color: 0xdb181e }); // Peach color
  const x = -2.5;
  const y = -5;
  shape.moveTo(x + 2.5, y + 2.5);
  shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2, y, x, y);
  shape.bezierCurveTo(x - 3, y, x - 3, y + 3.5, x - 3, y + 3.5);
  shape.bezierCurveTo(x - 3, y + 5.5, x - 1.5, y + 7.7, x + 2.5, y + 9.5);
  shape.bezierCurveTo(x + 6, y + 7.7, x + 8, y + 4.5, x + 8, y + 3.5);
  shape.bezierCurveTo(x + 8, y + 3.5, x + 8, y, x + 5, y);
  shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5);

  const extrudeSettings = {
    steps: 1, // ui: steps
    depth: 1, // ui: depth
    bevelEnabled: true, // ui: bevelEnabled
    bevelThickness: 1, // ui: bevelThickness
    bevelSize: 0, // ui: bevelSize
    bevelSegments: 1, // ui: bevelSegments
  };
  const heaGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  heaGeometry.scale(0.03, 0.03, 0.03);

  return function () {
    var hea = new THREE.Mesh(heaGeometry, heaMaterial);
    hea.isHea = true;
    hea.rotation.x = -Math.PI / 2;
    return hea;
  };
})();

// FAIL NGAB, gabisa hapus objeknya
// const path="../assets/objek/small_bottle/scene.gltf"
// var createHea = (function (x, y) {
//   const loader = new GLTFLoader()
//   const dracoLoader = new DRACOLoader()
//   loader.setDRACOLoader(dracoLoader)

//   return function(x, y){
//     var hea = loader.load(path, (gltf) => {
//       gltf.scene.traverse( function ( child ) {
//         if ( child.isMesh ) {
//             child.geometry.center(); // center here
//         }
//     });
//       gltf.scene.castShadow = true;
//       gltf.scene.receiveShadow = true;
//       gltf.scene.position.set(x,y,0);
//       gltf.scene.scale.setScalar(0.1);
//       var heaObj = gltf.scene;
//       scene.add(heaObj)
//       // var box = new THREE.Box3().setFromObject(hea);
//       // console.log("tes" + box.min, box.max, box.getSize());
//     })
//     return hea;
//   }
// })();
