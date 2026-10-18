/* ==================== 3D ANIME CINEMATIC HOME SCREEN ==================== */
var JDR = window.JDR || {};

JDR.HomeCinematic3D = (function(){
  var scene, camera, renderer;
  var canvas, animId;
  var isRunning = false;
  var heroDinoMesh = null;
  var heroRiderMesh = null;
  var heroGroup = null;
  var waterfallMist = [];
  var pteranodons = [];
  var floatingLeaves = [];
  var riverMesh = null;
  var mouseTarget = new THREE.Vector2(0, 0);
  var mouseCurrent = new THREE.Vector2(0, 0);

  function init(){
    canvas = document.getElementById('home-3d-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'home-3d-canvas';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '1';
      canvas.style.pointerEvents = 'none';
      var container = document.getElementById('ambient-bg') || document.getElementById('app');
      if (container) container.insertBefore(canvas, container.firstChild);
    }

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.2, 500);
    camera.position.set(2.2, 3.2, 10.5);
    camera.lookAt(0.5, 2.4, 0);

    buildEnvironment();
    buildHeroDinoAndRider();
    initVFX();

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
  }

  function onResize(){
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onMouseMove(e){
    mouseTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function onTouchMove(e){
    if (e.touches.length > 0) {
      mouseTarget.x = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
      mouseTarget.y = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    }
  }

  function buildEnvironment(){
    // Sky Dome / Gradient Backdrop with Anime Palette
    var skyGeom = new THREE.SphereGeometry(220, 32, 16);
    var skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512; skyCanvas.height = 512;
    var sctx = skyCanvas.getContext('2d');
    var skyGrad = sctx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0, '#3697d9');     // Deep anime sky blue
    skyGrad.addColorStop(0.45, '#65BCEB');  // Cinematic bright sky blue
    skyGrad.addColorStop(0.78, '#FFE0A0');  // Warm golden sunlit haze
    skyGrad.addColorStop(1.0, '#FFC857');   // Golden horizon
    sctx.fillStyle = skyGrad;
    sctx.fillRect(0, 0, 512, 512);

    // Paint fluffy anime clouds into sky texture
    sctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (var c = 0; c < 24; c++) {
      var cx = Math.random() * 512;
      var cy = 120 + Math.random() * 220;
      var cr = 20 + Math.random() * 45;
      sctx.beginPath();
      sctx.arc(cx, cy, cr, 0, Math.PI * 2);
      sctx.arc(cx + cr * 0.7, cy - cr * 0.2, cr * 0.8, 0, Math.PI * 2);
      sctx.arc(cx - cr * 0.6, cy + cr * 0.1, cr * 0.6, 0, Math.PI * 2);
      sctx.fill();
    }

    var skyTex = new THREE.CanvasTexture(skyCanvas);
    var skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide });
    var skyMesh = new THREE.Mesh(skyGeom, skyMat);
    scene.add(skyMesh);

    // Directional Golden Sunlight
    var sunLight = new THREE.DirectionalLight(0xffe0a0, 2.2);
    sunLight.position.set(28, 42, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 120;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Ambient Hemisphere Lighting (Warm Golden Top, Deep Forest Emerald Bottom)
    var hemiLight = new THREE.HemisphereLight(0xffe8b5, 0x1d4d31, 1.15);
    scene.add(hemiLight);

    // Cinematic Anime Rim Light (Sky Blue Contours)
    var rimLight = new THREE.DirectionalLight(0x65bceb, 1.35);
    rimLight.position.set(-25, 18, -20);
    scene.add(rimLight);

    // Warm Sun Lens Flares / Sun Disk
    var sunMesh = new THREE.Mesh(
      new THREE.CircleGeometry(16, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff0c2, transparent: true, opacity: 0.9 })
    );
    sunMesh.position.set(70, 75, -130);
    scene.add(sunMesh);

    // Distant Anime Mountain Peaks
    var mtnMat = new THREE.MeshStandardMaterial({
      color: 0x22485c,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });
    for (var m = 0; m < 7; m++) {
      var h = 35 + Math.random() * 30;
      var w = 22 + Math.random() * 20;
      var mtn = new THREE.Mesh(new THREE.ConeGeometry(w, h, 5), mtnMat);
      mtn.position.set(-80 + m * 28 + (Math.random() - 0.5) * 15, h * 0.45 - 6, -85 - Math.random() * 30);
      scene.add(mtn);
    }

    // Scenic Ancient Cliff Overlook (Foreground Promontory)
    var cliffGeom = new THREE.CylinderGeometry(8.5, 12, 10, 16);
    var cliffTex = JDR.World3D ? JDR.World3D.createBiomeTerrainTexture ? JDR.World3D.createBiomeTerrainTexture('jungle', 0x3d702d) : null : null;
    var cliffMat = new THREE.MeshStandardMaterial({
      color: 0x487a38,
      map: cliffTex,
      roughness: 0.78,
      metalness: 0.08
    });
    var cliff = new THREE.Mesh(cliffGeom, cliffMat);
    cliff.position.set(1.5, -4.8, -0.5);
    cliff.receiveShadow = true;
    scene.add(cliff);

    // Ancient Mossy Boulders on Overlook
    var rockMat = new THREE.MeshStandardMaterial({ color: 0x5a5448, roughness: 0.85 });
    [-4.5, 5.0, -2.8].forEach(function(rx, i){
      var r = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + i * 0.4, 1), rockMat);
      r.position.set(rx, 0.4, -2.5 + i * 1.8);
      r.rotation.set(i, i * 0.5, 0);
      r.castShadow = true;
      r.receiveShadow = true;
      scene.add(r);
    });

    // Winding Turquoise Valley River
    var riverGeom = new THREE.PlaneGeometry(160, 60, 16, 16);
    riverGeom.rotateX(-Math.PI / 2);
    var riverMat = new THREE.MeshStandardMaterial({
      color: 0x18a5b8,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    riverMesh = new THREE.Mesh(riverGeom, riverMat);
    riverMesh.position.set(10, -9.5, -45);
    scene.add(riverMesh);

    // Waterfall Geometry
    var wfGeom = new THREE.PlaneGeometry(12, 28, 4, 12);
    var wfMat = new THREE.MeshStandardMaterial({
      color: 0x88e6ff,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.82
    });
    var waterfall = new THREE.Mesh(wfGeom, wfMat);
    waterfall.position.set(-28, 4, -48);
    waterfall.rotation.y = 0.35;
    scene.add(waterfall);

    // Prehistoric Cycad / Tropical Trees on Overlook Rim
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.85 });
    var foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x277A49, roughness: 0.65 });
    var foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x75B85A, roughness: 0.6 });

    [-6.2, 5.8].forEach(function(tx, idx){
      var treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0.2, -4.5 - idx * 2);

      var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 4.5, 8), trunkMat);
      trunk.position.y = 2.25;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      var c1 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3.8, 7), foliageMat1);
      c1.position.y = 4.2;
      c1.castShadow = true;
      treeGroup.add(c1);

      var c2 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.2, 7), foliageMat2);
      c2.position.y = 5.6;
      c2.castShadow = true;
      treeGroup.add(c2);

      scene.add(treeGroup);
    });

    // Distant Soaring Pteranodons in Sky
    var pteraGeom = new THREE.BufferGeometry();
    var pteraMat = new THREE.MeshBasicMaterial({ color: 0x1a2e3b });
    for (var p = 0; p < 4; p++) {
      var pGroup = new THREE.Group();
      var body = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.5, 4), pteraMat);
      body.rotation.x = Math.PI / 2;
      pGroup.add(body);
      var wings = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.08, 1.2), pteraMat);
      pGroup.add(wings);

      pGroup.position.set(-45 + p * 25, 26 + p * 4, -75 - p * 15);
      scene.add(pGroup);
      pteranodons.push({
        group: pGroup,
        speed: 8.5 + p * 2.2,
        wingMesh: wings,
        baseX: -45 + p * 25,
        radius: 35 + p * 12,
        angle: p * 1.5
      });
    }
  }

  function initVFX(){
    // Waterfall Mist Particles
    var mistGeom = new THREE.DodecahedronGeometry(0.8, 0);
    var mistMat = new THREE.MeshBasicMaterial({
      color: 0xdef6ff,
      transparent: true,
      opacity: 0.45
    });
    for (var m = 0; m < 16; m++) {
      var p = new THREE.Mesh(mistGeom, mistMat);
      p.position.set(-28 + (Math.random() - 0.5) * 5, -8 + Math.random() * 4, -48 + (Math.random() - 0.5) * 4);
      scene.add(p);
      waterfallMist.push({
        mesh: p,
        baseY: -8,
        vy: 1.5 + Math.random() * 2,
        life: Math.random() * 2
      });
    }

    // Golden Sun-Motes & Falling Anime Leaves
    var leafGeom = new THREE.PlaneGeometry(0.35, 0.55);
    var leafMat = new THREE.MeshBasicMaterial({
      color: 0xFFC857,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    for (var l = 0; l < 28; l++) {
      var lf = new THREE.Mesh(leafGeom, leafMat);
      lf.position.set(
        (Math.random() - 0.5) * 18,
        1 + Math.random() * 8,
        -2 + (Math.random() - 0.5) * 12
      );
      scene.add(lf);
      floatingLeaves.push({
        mesh: lf,
        vy: 0.6 + Math.random() * 0.8,
        vx: 0.3 + Math.random() * 0.5,
        rotSpeed: 1.5 + Math.random() * 2.5
      });
    }
  }

  function buildHeroDinoAndRider(){
    if (heroGroup) {
      scene.remove(heroGroup);
    }
    heroGroup = new THREE.Group();

    var s = JDR.SaveManager ? JDR.SaveManager.data : null;
    var dinoId = (s && s.selectedDino) ? s.selectedDino : 'trex';
    var dinoConf = JDR.DINOS.find(function(d){ return d.id === dinoId; }) || JDR.DINOS[0];

    // Create 3D Dinosaur
    var dinoObj = JDR.Dino3D.createDinosaurMesh(dinoConf);
    heroDinoMesh = dinoObj;
    heroGroup.add(heroDinoMesh.root);

    // Create Hero Explorer Rider
    var riderObj = JDR.Player3D.createPlayerMesh();
    heroRiderMesh = riderObj;

    // Attach rider directly to dinosaur saddle mount anchor
    var anchor = dinoConf.mountAnchor || { x: 0, y: 3.1, z: 0.4 };
    heroRiderMesh.root.position.set(anchor.x, anchor.y, anchor.z);
    heroRiderMesh.root.scale.set(0.95, 0.95, 0.95);
    heroRiderMesh.setRidingState(true);
    heroDinoMesh.root.add(heroRiderMesh.root);

    // Position Hero Group on the overlook cliff
    heroGroup.position.set(0.6, 0.2, 0.8);
    heroGroup.rotation.y = -0.55; // Cinematic 3/4 hero profile looking toward the sunlight

    scene.add(heroGroup);
  }

  function refreshHeroDino(){
    buildHeroDinoAndRider();
  }

  function start(){
    if (!renderer) init();
    if (isRunning) return;
    isRunning = true;
    lastTime = performance.now();
    loop();
  }

  function stop(){
    isRunning = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  var lastTime = 0;
  function loop(){
    if (!isRunning) return;
    animId = requestAnimationFrame(loop);

    var now = performance.now();
    var delta = Math.min((now - lastTime) * 0.001, 0.1);
    lastTime = now;
    var time = now * 0.001;

    // Parallax Camera Damping
    mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.05;
    mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.05;

    camera.position.x = 2.2 + mouseCurrent.x * 0.85;
    camera.position.y = 3.2 - mouseCurrent.y * 0.45;
    camera.lookAt(0.5, 2.3, 0);

    // Hero Dinosaur Idle Breathing & Animation
    if (heroDinoMesh) {
      var breath = Math.sin(time * 2.2);
      if (heroDinoMesh.spine) {
        heroDinoMesh.spine.scale.y = 1.0 + breath * 0.025;
        heroDinoMesh.spine.rotation.x = Math.sin(time * 1.4) * 0.03;
      }
      if (heroDinoMesh.tail) {
        heroDinoMesh.tail.rotation.y = Math.sin(time * 1.6) * 0.08;
      }
      if (heroDinoMesh.neck) {
        heroDinoMesh.neck.rotation.x = -0.05 + Math.sin(time * 1.2) * 0.04;
        heroDinoMesh.neck.rotation.y = Math.sin(time * 0.8) * 0.05;
      }
    }

    // Hero Rider Gentle Sway
    if (heroRiderMesh && heroRiderMesh.torso) {
      heroRiderMesh.torso.rotation.x = Math.sin(time * 2.2) * 0.03;
    }

    // Waterfall Mist Animation
    for (var m = 0; m < waterfallMist.length; m++) {
      var mist = waterfallMist[m];
      mist.life += delta;
      mist.mesh.position.y += mist.vy * delta;
      var prog = (mist.mesh.position.y - mist.baseY) / 10;
      mist.mesh.scale.set(1 + prog * 2, 1 + prog * 2, 1 + prog * 2);
      mist.mesh.material.opacity = Math.max(0, 0.45 * (1 - prog));
      if (mist.mesh.position.y > mist.baseY + 10) {
        mist.mesh.position.y = mist.baseY;
      }
    }

    // Soaring Pteranodons Circular Flight
    for (var p = 0; p < pteranodons.length; p++) {
      var pt = pteranodons[p];
      pt.angle += delta * 0.35;
      pt.group.position.x = pt.baseX + Math.cos(pt.angle) * pt.radius;
      pt.group.position.z = -75 + Math.sin(pt.angle) * (pt.radius * 0.6);
      pt.group.rotation.y = -pt.angle + Math.PI / 2;
      // Wing flap
      pt.wingMesh.rotation.z = Math.sin(time * 6.5 + p) * 0.35;
    }

    // Drifting Leaves & Sun-Motes
    for (var l = 0; l < floatingLeaves.length; l++) {
      var lf = floatingLeaves[l];
      lf.mesh.position.y -= lf.vy * delta;
      lf.mesh.position.x += Math.sin(time * 2.0 + l) * lf.vx * delta;
      lf.mesh.rotation.z += lf.rotSpeed * delta;
      if (lf.mesh.position.y < -2) {
        lf.mesh.position.y = 8 + Math.random() * 4;
        lf.mesh.position.x = (Math.random() - 0.5) * 18;
      }
    }

    renderer.render(scene, camera);
  }

  return {
    init: init,
    start: start,
    stop: stop,
    refreshHeroDino: refreshHeroDino
  };
})();
