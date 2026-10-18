/* ==================== 3D SIMULATOR MASTER ENGINE ==================== */
var JDR = window.JDR || {};

JDR.simEngine = (function(){
  var canvas, renderer, scene, camera, cameraCtrl;
  var world3D = null;
  var dinoInstance = null;
  var dinoCtrl = null;
  var playerInstance = null;
  var playerCtrl = null;
  var sunLight = null;
  var ambientLight = null;

  var running = false;
  var paused = false;
  var lastTime = 0;

  // Key states
  var keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false
  };

  // Mobile virtual joystick input
  var joystickVec = new THREE.Vector2(0, 0);

  // Time trial mode
  var isTimeTrial = false;
  var timeTrialTimer = 0;
  var checkpointsPassed = 0;

  function init(){
    canvas = document.getElementById('canvas-3d');
    if (!canvas) return;

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(
      JDR.CONFIG.SIM_3D.CAMERA_FOV || 65,
      window.innerWidth / window.innerHeight,
      0.2,
      600
    );
    cameraCtrl = new JDR.Camera3D(camera, canvas);

    window.addEventListener('resize', onWindowResize);
    setupKeyboard();
    setupMobileControls();
  }

  function onWindowResize(){
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function start(options){
    if (!renderer) init();
    options = options || {};
    isTimeTrial = !!options.timeTrial;
    timeTrialTimer = 0;
    checkpointsPassed = 0;

    var s = JDR.SaveManager.data;
    var mapId = s.selectedMap || 'jungle';
    var mapConfig = JDR.MAPS.find(function(m){ return m.id === mapId; }) || JDR.MAPS[0];

    // Clear previous scene objects
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Sky & Distance Fog
    scene.background = new THREE.Color(mapConfig.skyColor || 0x88c4e0);
    scene.fog = new THREE.Fog(
      mapConfig.fogColor || 0x224828,
      mapConfig.fogNear || 25,
      mapConfig.fogFar || 180
    );

    // Directional Sun Light casting shadows
    sunLight = new THREE.DirectionalLight(mapConfig.sunColor || 0xfff3d6, mapConfig.sunIntensity || 1.6);
    sunLight.position.set(45, 80, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 220;
    var d = 60;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Ambient Hemisphere Light
    ambientLight = new THREE.HemisphereLight(mapConfig.sunColor || 0xfff3d6, mapConfig.ambientColor || 0x6e9070, 0.7);
    scene.add(ambientLight);

    // Build World (Terrain, Biome, Collectibles)
    world3D = new JDR.World3D(scene, mapConfig);

    // Spawn Player Dinosaur
    var dinoId = s.selectedDino || 'trex';
    var dinoConf = JDR.DINOS.find(function(d){ return d.id === dinoId; }) || JDR.DINOS[0];
    dinoInstance = JDR.Dino3D.createDinosaurMesh(dinoConf);
    dinoCtrl = new JDR.Dino3D.DinosaurController(dinoInstance);

    var spawnGroundY = world3D.getTerrainHeight(0, 0);
    dinoInstance.root.position.set(0, spawnGroundY, 0);
    scene.add(dinoInstance.root);

    // Spawn Player Explorer
    playerInstance = JDR.Player3D.createPlayerMesh();
    playerCtrl = new JDR.Player3D.PlayerController(playerInstance);

    // Start mounted in saddle
    dinoInstance.parts.mountNode.add(playerInstance.root);
    playerInstance.root.position.set(0, 0.45, 0);
    playerCtrl.isMounted = true;
    playerCtrl.mountedDino = dinoCtrl;
    dinoCtrl.isMounted = true;
    playerCtrl.setRidingPose();

    // Start audio ambience
    JDR.Audio3D.init();
    JDR.Audio3D.setBiomeAmbience(mapConfig.biomeType);

    // HUD setup
    updateHUDStatic(dinoConf, mapConfig);

    running = true;
    paused = false;
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }

  function gameLoop(now){
    if (!running) return;
    requestAnimationFrame(gameLoop);

    var delta = Math.min(0.08, (now - lastTime) * 0.001);
    lastTime = now;

    if (paused) return;

    updateSimulation(delta);
    renderer.render(scene, camera);
  }

  function updateSimulation(delta){
    // Determine movement intent vector relative to camera yaw
    var moveForward = 0;
    var moveSide = 0;

    if (keys.forward) moveForward += 1;
    if (keys.backward) moveForward -= 1;
    if (keys.right) moveSide += 1;
    if (keys.left) moveSide -= 1;

    // Add joystick vector
    if (joystickVec.length() > 0.1) {
      moveSide += joystickVec.x;
      moveForward += joystickVec.y;
    }

    var inputMagnitude = Math.min(1.0, Math.sqrt(moveForward * moveForward + moveSide * moveSide));
    var isSprinting = keys.sprint;

    // Movement direction in world space oriented with camera angle
    var camAngle = cameraCtrl.yaw;
    var worldMoveX = moveSide * Math.cos(camAngle) + moveForward * Math.sin(camAngle);
    var worldMoveZ = -moveSide * Math.sin(camAngle) + moveForward * Math.cos(camAngle);
    var worldMoveVec = new THREE.Vector3(worldMoveX, 0, worldMoveZ);

    var activeFocusPos = new THREE.Vector3();

    // ==================== MOUNTED RIDING DYNAMICS ====================
    if (playerCtrl.isMounted) {
      var dinoRoot = dinoInstance.root;
      var currentPos = dinoRoot.position;

      // Turning / Steering
      if (inputMagnitude > 0.05) {
        var targetAngle = Math.atan2(worldMoveVec.x, worldMoveVec.z);
        var currentAngle = dinoRoot.rotation.y;
        var diff = targetAngle - currentAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        dinoRoot.rotation.y += diff * Math.min(1.0, delta * (dinoCtrl.config.turnRate3D || 2.5));
      }

      // Dinosaur jump or flight
      var inWater = world3D && currentPos.y <= (world3D.map.waterLevel || -1.2) + 0.3;

      if (keys.jump && dinoCtrl.isGrounded) {
        dinoCtrl.verticalVelocity = dinoCtrl.config.jumpImpulse3D || 10.0;
        dinoCtrl.isGrounded = false;
        JDR.Audio3D.playFootstep(dinoCtrl.config.mass3D, true, inWater);
      }

      // Update Dinosaur speed and procedural limbs
      dinoCtrl.update(delta, inputMagnitude, isSprinting, keys.jump, false, inWater);

      // Move forward along dinosaur's facing direction
      var speed = dinoCtrl.speed;
      var moveStep = new THREE.Vector3(0, 0, speed * delta).applyAxisAngle(new THREE.Vector3(0, 1, 0), dinoRoot.rotation.y);
      currentPos.add(moveStep);

      // Gravity and terrain height
      var terrainY = world3D ? world3D.getTerrainHeight(currentPos.x, currentPos.z) : 0;
      if (dinoCtrl.config.canSwim && currentPos.y < (world3D.map.waterLevel || -1.2)) {
        currentPos.y = world3D.map.waterLevel;
        dinoCtrl.verticalVelocity = 0;
        dinoCtrl.isGrounded = true;
      } else if (!dinoCtrl.isGrounded) {
        dinoCtrl.verticalVelocity += (JDR.CONFIG.SIM_3D.GRAVITY || -24.0) * delta;
        currentPos.y += dinoCtrl.verticalVelocity * delta;
        if (currentPos.y <= terrainY) {
          currentPos.y = terrainY;
          dinoCtrl.verticalVelocity = 0;
          dinoCtrl.isGrounded = true;
          JDR.Audio3D.playFootstep(dinoCtrl.config.mass3D, false, inWater);
        }
      } else {
        currentPos.y = terrainY;
      }

      // Sun follows player for endless shadow fidelity
      sunLight.position.set(currentPos.x + 45, 80, currentPos.z + 50);
      sunLight.target.position.copy(currentPos);
      sunLight.target.updateMatrixWorld();

      activeFocusPos.copy(currentPos);
      activeFocusPos.y += 1.8;

      // Update multiplayer sync
      JDR.Multiplayer3D.syncLocal(currentPos, dinoRoot.rotation.y, speed, true);

    } else {
      // ==================== ON-FOOT EXPLORATION DYNAMICS ====================
      playerCtrl.update(delta, worldMoveVec, isSprinting, keys.jump, world3D);
      activeFocusPos.copy(playerInstance.root.position);
      activeFocusPos.y += 1.0;

      // Check proximity to dinosaur for mounting prompt
      var dPos = dinoInstance.root.position;
      var pPos = playerInstance.root.position;
      var distToDino = dPos.distanceTo(pPos);

      var promptEl = document.getElementById('hud-prompt');
      if (promptEl) {
        if (distToDino < (JDR.CONFIG.SIM_3D.INTERACTION_RADIUS || 5.5)) {
          promptEl.style.display = 'flex';
          promptEl.innerHTML = '<span class="clay-badge">E</span> Mount ' + dinoCtrl.config.name;
        } else {
          promptEl.style.display = 'none';
        }
      }

      // Dinosaur grazes / breathes in companion idle
      dinoCtrl.update(delta, 0, false, false, false, false);
      JDR.Multiplayer3D.syncLocal(playerInstance.root.position, playerInstance.root.rotation.y, playerCtrl.speed, false);
    }

    // Update Follow Camera
    cameraCtrl.update(delta, activeFocusPos, world3D);

    // Update World (collectibles, animated particles)
    if (world3D) {
      world3D.update(delta, activeFocusPos);
    }

    // Update Remote Multiplayer Players
    JDR.Multiplayer3D.update(delta);

    // Update Dynamic HUD
    updateHUDLive(delta);
  }

  function updateHUDStatic(dinoConf, mapConfig){
    var nameEl = document.getElementById('hud-dino-name');
    var badgeEl = document.getElementById('hud-mount-badge');
    var mapNameEl = document.getElementById('hud-map-name');

    if (nameEl) nameEl.textContent = dinoConf.name;
    if (badgeEl) badgeEl.textContent = 'MOUNTED 🏇';
    if (mapNameEl) mapNameEl.textContent = mapConfig.name;
  }

  function updateHUDLive(delta){
    // Stamina bar
    var staminaFill = document.getElementById('hud-stamina-fill');
    if (staminaFill && dinoCtrl) {
      var pct = (dinoCtrl.stamina / (dinoCtrl.config.staminaMax3D || 100)) * 100;
      staminaFill.style.width = pct + '%';
    }

    // Speedometer
    var speedVal = document.getElementById('hud-speed-val');
    var gallopLabel = document.getElementById('hud-gallop-label');
    if (speedVal && dinoCtrl) {
      var kmh = Math.round(dinoCtrl.speed * 3.6);
      speedVal.textContent = kmh;
      if (gallopLabel) {
        gallopLabel.textContent = dinoCtrl.state.toUpperCase();
      }
    }

    // Compass
    var compassNeedle = document.getElementById('hud-compass-needle');
    if (compassNeedle && cameraCtrl) {
      var deg = Math.round((-cameraCtrl.yaw * 180) / Math.PI);
      compassNeedle.style.transform = 'rotate(' + deg + 'deg)';
    }

    // Mount / Dismount button prompt
    var promptEl = document.getElementById('hud-prompt');
    if (promptEl && playerCtrl.isMounted) {
      promptEl.style.display = 'flex';
      promptEl.innerHTML = '<span class="clay-badge">E</span> Press E to Dismount';
    }
  }

  function toggleMount(){
    if (!playerCtrl) return;
    if (playerCtrl.isMounted) {
      playerCtrl.dismountDinosaur(world3D);
      var badge = document.getElementById('hud-mount-badge');
      if (badge) badge.textContent = 'ON FOOT 🚶';
    } else {
      var dPos = dinoInstance.root.position;
      var pPos = playerInstance.root.position;
      if (dPos.distanceTo(pPos) < (JDR.CONFIG.SIM_3D.INTERACTION_RADIUS || 5.5)) {
        playerCtrl.mountDinosaur(dinoCtrl);
        var badge2 = document.getElementById('hud-mount-badge');
        if (badge2) badge2.textContent = 'MOUNTED 🏇';
      }
    }
  }

  function performRoar(){
    if (dinoCtrl) {
      dinoCtrl.update(0.01, 0, false, false, true, false);
      JDR.Multiplayer3D.sendRoar(dinoCtrl.config.roarSound);
    }
  }

  function onAmberCollected(){
    var coinsEl = document.getElementById('hud-amber-count');
    if (coinsEl && JDR.SaveManager) {
      coinsEl.textContent = JDR.SaveManager.data.coins;
    }
  }

  function onLavaHazard(){
    if (dinoCtrl) {
      dinoCtrl.stamina = Math.max(0, dinoCtrl.stamina - 15);
      JDR.Audio3D.playFootstep(3000, true, true);
    }
  }

  function setupKeyboard(){
    window.addEventListener('keydown', function(e){
      var activeScreen = JDR.app ? JDR.app.currentScreen : '';
      if (activeScreen !== 'game-3d-screen') return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.sprint = true;
      if (e.code === 'Space') { e.preventDefault(); keys.jump = true; }
      if (e.code === 'KeyE') { e.preventDefault(); toggleMount(); }
      if (e.code === 'KeyR') { e.preventDefault(); performRoar(); }
      if (e.code === 'Escape') { e.preventDefault(); togglePause(); }
    });

    window.addEventListener('keyup', function(e){
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.sprint = false;
      if (e.code === 'Space') keys.jump = false;
    });
  }

  function setupMobileControls(){
    var jZone = document.getElementById('joystick-zone');
    var jKnob = document.getElementById('joystick-knob');
    if (!jZone || !jKnob) return;

    var touchId = null;
    var startX = 0, startY = 0;
    var maxRadius = 45;

    jZone.addEventListener('touchstart', function(e){
      var t = e.changedTouches[0];
      touchId = t.identifier;
      var rect = jZone.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      handleJoystickMove(t.clientX, t.clientY);
    }, { passive: false });

    jZone.addEventListener('touchmove', function(e){
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === touchId) {
          handleJoystickMove(t.clientX, t.clientY);
          break;
        }
      }
    }, { passive: false });

    function handleJoystickMove(cx, cy){
      var dx = cx - startX;
      var dy = cy - startY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      jKnob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      joystickVec.set(dx / maxRadius, -dy / maxRadius);
    }

    var endJoy = function(){
      touchId = null;
      jKnob.style.transform = 'translate(0px, 0px)';
      joystickVec.set(0, 0);
    };
    jZone.addEventListener('touchend', endJoy);
    jZone.addEventListener('touchcancel', endJoy);

    // Mobile Action buttons
    var btnJump = document.getElementById('m-btn-jump');
    if (btnJump) {
      btnJump.addEventListener('touchstart', function(e){ e.preventDefault(); keys.jump = true; });
      btnJump.addEventListener('touchend', function(e){ e.preventDefault(); keys.jump = false; });
    }
    var btnSprint = document.getElementById('m-btn-sprint');
    if (btnSprint) {
      btnSprint.addEventListener('touchstart', function(e){ e.preventDefault(); keys.sprint = true; });
      btnSprint.addEventListener('touchend', function(e){ e.preventDefault(); keys.sprint = false; });
    }
    var btnMount = document.getElementById('m-btn-mount');
    if (btnMount) {
      btnMount.addEventListener('touchstart', function(e){ e.preventDefault(); toggleMount(); });
    }
    var btnRoar = document.getElementById('m-btn-roar');
    if (btnRoar) {
      btnRoar.addEventListener('touchstart', function(e){ e.preventDefault(); performRoar(); });
    }
  }

  function togglePause(){
    paused = !paused;
    var overlay = document.getElementById('sim-pause-overlay');
    if (overlay) overlay.style.display = paused ? 'flex' : 'none';
  }

  function resume(){
    paused = false;
    var overlay = document.getElementById('sim-pause-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function quit(){
    running = false;
    paused = false;
    var overlay = document.getElementById('sim-pause-overlay');
    if (overlay) overlay.style.display = 'none';
    JDR.Multiplayer3D.leave();
    if (JDR.app) JDR.app.showScreen('main-menu');
  }

  return {
    init: init,
    start: start,
    resume: resume,
    quit: quit,
    toggleMount: toggleMount,
    performRoar: performRoar,
    onAmberCollected: onAmberCollected,
    onLavaHazard: onLavaHazard,
    get currentDinoPos(){ return dinoInstance ? dinoInstance.root.position : new THREE.Vector3(); },
    get currentDinoYaw(){ return dinoInstance ? dinoInstance.root.rotation.y : 0; },
    get playerCtrl(){ return playerCtrl; },
    get scene(){ return scene; }
  };
})();
