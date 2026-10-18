/* ==================== 3D THIRD-PERSON FOLLOW CAMERA ==================== */
var JDR = window.JDR || {};

JDR.Camera3D = (function(){
  function Camera3D(camera, domElement){
    this.camera = camera;
    this.domElement = domElement || window;
    this.target = new THREE.Vector3(0, 2, 0);

    // Spherical coordinates
    this.distance = JDR.CONFIG.SIM_3D.CAMERA_DEFAULT_DISTANCE || 7.5;
    this.minDistance = JDR.CONFIG.SIM_3D.CAMERA_MIN_DISTANCE || 3.0;
    this.maxDistance = JDR.CONFIG.SIM_3D.CAMERA_MAX_DISTANCE || 18.0;

    this.yaw = 0; // horizontal angle
    this.pitch = JDR.CONFIG.SIM_3D.CAMERA_DEFAULT_PITCH || 0.28; // vertical angle
    this.minPitch = -0.15; // don't look completely from below
    this.maxPitch = 1.35;  // bird's eye limit

    this.sensitivity = 0.0035;
    this.zoomSensitivity = 0.002;
    this.damping = 10.0;

    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    this.setupInputs();
  }

  Camera3D.prototype.setupInputs = function(){
    var self = this;

    // Desktop Mouse Drag
    window.addEventListener('mousedown', function(e){
      // Don't drag if clicking on UI buttons
      if (e.target && (e.target.closest('button') || e.target.closest('.clay-card') || e.target.closest('#hud-3d'))) return;
      self.isDragging = true;
      self.lastPointerX = e.clientX;
      self.lastPointerY = e.clientY;
    });

    window.addEventListener('mousemove', function(e){
      if (!self.isDragging) return;
      var dx = e.clientX - self.lastPointerX;
      var dy = e.clientY - self.lastPointerY;
      self.lastPointerX = e.clientX;
      self.lastPointerY = e.clientY;

      var settings = (JDR.SaveManager && JDR.SaveManager.data && JDR.SaveManager.data.settings) ? JDR.SaveManager.data.settings : {};
      var sensMul = settings.cameraSensitivity !== undefined ? settings.cameraSensitivity : 1.0;
      var invertY = settings.cameraInvertY ? -1 : 1;
      var effSens = self.sensitivity * sensMul;

      self.yaw -= dx * effSens;
      self.pitch += dy * effSens * invertY;
      self.pitch = Math.max(self.minPitch, Math.min(self.maxPitch, self.pitch));
    });

    window.addEventListener('mouseup', function(){
      self.isDragging = false;
    });

    // Mouse Wheel Zoom
    window.addEventListener('wheel', function(e){
      self.distance += e.deltaY * self.zoomSensitivity;
      self.distance = Math.max(self.minDistance, Math.min(self.maxDistance, self.distance));
    }, { passive: true });

    // Mobile Touch Drag for Camera with Multitouch Support
    var touchStartX = 0, touchStartY = 0;
    self.cameraTouchId = null;

    window.addEventListener('touchstart', function(e){
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        // Ignore touches on interactive mobile controls, joystick, buttons, or HUD
        if (t.target && (t.target.closest('.mobile-action-btn') || t.target.closest('#joystick-zone') || t.target.closest('#hud-3d') || t.target.closest('.hud-btn-pause') || t.target.closest('.btn'))) {
          continue;
        }
        if (self.cameraTouchId === null) {
          self.cameraTouchId = t.identifier;
          touchStartX = t.clientX;
          touchStartY = t.clientY;
          self.isDragging = true;
          break;
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', function(e){
      if (!self.isDragging || self.cameraTouchId === null) return;
      var settings = (JDR.SaveManager && JDR.SaveManager.data && JDR.SaveManager.data.settings) ? JDR.SaveManager.data.settings : {};
      var sensMul = settings.cameraSensitivity !== undefined ? settings.cameraSensitivity : 1.0;
      var invertY = settings.cameraInvertY ? -1 : 1;
      var effSens = (self.sensitivity * 1.5) * sensMul;

      for (var i = 0; i < e.touches.length; i++) {
        var t = e.touches[i];
        if (t.identifier === self.cameraTouchId) {
          var dx = t.clientX - touchStartX;
          var dy = t.clientY - touchStartY;
          touchStartX = t.clientX;
          touchStartY = t.clientY;

          self.yaw -= dx * effSens;
          self.pitch += dy * effSens * invertY;
          self.pitch = Math.max(self.minPitch, Math.min(self.maxPitch, self.pitch));
          break;
        }
      }
    }, { passive: true });

    var endCameraTouch = function(e){
      if (self.cameraTouchId === null) return;
      if (e && e.changedTouches) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === self.cameraTouchId) {
            self.cameraTouchId = null;
            self.isDragging = false;
            break;
          }
        }
      } else {
        self.cameraTouchId = null;
        self.isDragging = false;
      }
    };

    window.addEventListener('touchend', endCameraTouch, { passive: true });
    window.addEventListener('touchcancel', endCameraTouch, { passive: true });
  };

  Camera3D.prototype.update = function(delta, focusPosition, world3D){
    if (focusPosition) {
      // Smooth focus target interpolation
      this.target.lerp(focusPosition, Math.min(1.0, delta * this.damping));
    }

    // Calculate ideal camera position based on yaw, pitch, and distance
    var horizontalDist = this.distance * Math.cos(this.pitch);
    var verticalDist = this.distance * Math.sin(this.pitch);

    var offsetX = horizontalDist * Math.sin(this.yaw);
    var offsetZ = horizontalDist * Math.cos(this.yaw);

    var targetCamPos = new THREE.Vector3(
      this.target.x - offsetX,
      this.target.y + verticalDist + (JDR.CONFIG.SIM_3D.CAMERA_HEIGHT_OFFSET || 2.0),
      this.target.z - offsetZ
    );

    // Ground obstruction collision check (keep camera at least 0.8m above ground)
    if (world3D) {
      var terrainY = world3D.getTerrainHeight(targetCamPos.x, targetCamPos.z);
      if (targetCamPos.y < terrainY + 1.0) {
        targetCamPos.y = terrainY + 1.0;
      }
    }

    // Smooth camera damping
    this.camera.position.lerp(targetCamPos, Math.min(1.0, delta * (this.damping * 1.2)));

    // Look at target slightly elevated (chest/head height)
    var lookTarget = this.target.clone();
    lookTarget.y += 1.6;
    this.camera.lookAt(lookTarget);
  };

  return Camera3D;
})();
