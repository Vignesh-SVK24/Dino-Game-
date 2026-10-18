/* ==================== APPLICATION COORDINATOR & UI CONTROLLER ==================== */
var JDR = window.JDR || {};

JDR.app = {
  currentScreen: 'loading-screen',
  previewScene: null,
  previewCamera: null,
  previewRenderer: null,
  previewDinoMesh: null,
  previewAnimId: null,

  init: function(){
    try { JDR.Audio.init(); } catch(e){ console.warn("Audio init:", e); }
    try { JDR.Audio3D.init(); } catch(e){ console.warn("Audio3D init:", e); }
    try { JDR.SaveManager.load(); } catch(e){ console.warn("SaveManager init:", e); }
    try { JDR.engine.init(); } catch(e){ console.warn("engine init:", e); }
    try { JDR.simEngine.init(); } catch(e){ console.warn("simEngine init:", e); }
    try {
      if (JDR.HomeCinematic3D) JDR.HomeCinematic3D.init();
    } catch(e) {
      console.warn("HomeCinematic3D init:", e);
    }

    try { this.setupControls(); } catch(e){ console.warn("setupControls error:", e); }
    this.fakeLoad();
  },

  fakeLoad: function(){
    var bar = document.getElementById('loading-bar');
    var txt = document.getElementById('loading-text');
    var msgs = [
      'Initializing Anime Cinematic 3D Engine...',
      'Synthesizing prehistoric valleys, rivers & waterfalls...',
      'Articulating 3D dinosaur skeletons & hero saddles...',
      'Awakening soaring Pteranodons in sky...',
      'Ready for Epic Dinosaur Adventure!'
    ];
    var p = 0;
    var self = this;
    var completed = false;

    function finish() {
      if (completed) return;
      completed = true;
      if (bar) bar.style.width = '100%';
      if (txt) txt.textContent = 'Ready for Adventure!';
      setTimeout(function(){
        self.showScreen('main-menu');
      }, 300);
    }

    var iv = setInterval(function(){
      p += Math.random() * 25 + 15;
      if (p > 100) p = 100;
      if (bar) bar.style.width = p + '%';
      if (txt) txt.textContent = msgs[Math.min(Math.floor((p / 100) * msgs.length), msgs.length - 1)];
      if (p >= 100) {
        clearInterval(iv);
        finish();
      }
    }, 120);

    // Guaranteed fallback: never get stuck on loading screen longer than 1.8s
    setTimeout(function(){
      clearInterval(iv);
      finish();
    }, 1800);
  },

  showScreen: function(id){
    document.querySelectorAll('.screen').forEach(function(s){
      s.classList.remove('active');
    });

    var el = document.getElementById(id);
    if (el) {
      el.classList.add('active');
      el.style.display = 'flex';
      setTimeout(function(){ el.style.opacity = '1'; }, 10);
    }

    document.querySelectorAll('.screen:not(.active)').forEach(function(s){
      s.style.opacity = '0';
      setTimeout(function(){
        if (!s.classList.contains('active')) s.style.display = 'none';
      }, 350);
    });

    // Control background 3D cinematic home scene
    if (id !== 'game-screen' && id !== 'game-3d-screen') {
      if (JDR.HomeCinematic3D) JDR.HomeCinematic3D.start();
    } else {
      if (JDR.HomeCinematic3D) JDR.HomeCinematic3D.stop();
    }

    // If leaving 3D preview, stop animation
    if (id !== 'shop-screen' && this.previewAnimId) {
      cancelAnimationFrame(this.previewAnimId);
      this.previewAnimId = null;
    }

    this.currentScreen = id;
    JDR.Audio3D.playClayClick();
    this.updateCoins();

    if (id === 'main-menu') this.refreshMenu();
    if (id === 'map-select') this.renderMaps();
    if (id === 'shop-screen') this.renderShop();
    if (id === 'scores-screen') this.renderScores();
    if (id === 'settings-screen') this.loadSettings();
    this.checkOrientationPrompt();
  },

  updateCoins: function(){
    var coins = JDR.SaveManager.data.coins;
    document.querySelectorAll('.coin-amount').forEach(function(el){
      el.textContent = coins;
    });
    var amberHud = document.getElementById('hud-amber-count');
    if (amberHud) amberHud.textContent = coins;
  },

  refreshMenu: function(){
    this.updateCoins();
    if (JDR.HomeCinematic3D) JDR.HomeCinematic3D.start();
  },

  // Launch the Flagship 3D Dinosaur Riding Simulation
  start3DSimulation: function(options){
    try {
      if (JDR.HomeCinematic3D) JDR.HomeCinematic3D.stop();
    } catch(e) {
      console.warn("HomeCinematic stop error:", e);
    }

    document.querySelectorAll('.screen').forEach(function(s){
      s.classList.remove('active');
      s.style.display = 'none';
      s.style.opacity = '0';
    });

    var screen3D = document.getElementById('game-3d-screen');
    if (screen3D) {
      screen3D.classList.add('active');
      screen3D.style.display = 'block';
      screen3D.style.opacity = '1';
      this.currentScreen = 'game-3d-screen';
    }

    // Attempt orientation lock on supported mobile devices
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(function(){});
    }
    this.checkOrientationPrompt();

    JDR.simEngine.start(options);
  },

  // Launch the Classic 2D Arcade Runner (Preserved)
  startClassic2D: function(mode){
    if (JDR.HomeCinematic3D) JDR.HomeCinematic3D.stop();
    this.showScreen('game-screen');
    setTimeout(function(){
      JDR.engine.start(mode);
    }, 250);
  },

  renderMaps: function(){
    var grid = document.getElementById('map-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var sel = JDR.SaveManager.data.selectedMap;
    var self = this;

    JDR.MAPS.forEach(function(m){
      var card = document.createElement('div');
      card.className = 'clay-card map-card' + (m.id === sel ? ' selected' : '') + (m.unlocked ? '' : ' locked');

      var cvs = document.createElement('canvas');
      cvs.width = 320; cvs.height = 180;
      var c = cvs.getContext('2d');

      // Draw stylized biome preview
      JDR.Background.reset();
      JDR.Background.draw(c, m, 320, 180, 0);

      var info = document.createElement('div');
      info.className = 'map-card-info';
      info.innerHTML = '<h4>' + m.name + '</h4><p>' + m.description + '</p>';

      card.appendChild(cvs);
      card.appendChild(info);

      if (!m.unlocked) {
        var lock = document.createElement('div');
        lock.className = 'map-lock';
        lock.textContent = '🔒 Unlock: ' + m.price + ' Amber Gems';
        card.appendChild(lock);

        card.onclick = function(){
          if (JDR.SaveManager.data.coins >= m.price) {
            JDR.SaveManager.data.coins -= m.price;
            JDR.SaveManager.data.unlockedMaps.push(m.id);
            m.unlocked = true;
            JDR.SaveManager.save();
            self.renderMaps();
            JDR.Audio3D.playAmberCollect();
          } else {
            alert('Need ' + m.price + ' Amber gems to unlock this biome!');
          }
        };
      } else {
        card.onclick = function(){
          JDR.SaveManager.data.selectedMap = m.id;
          JDR.SaveManager.save();
          self.renderMaps();
          JDR.Audio3D.playClayClick();
        };
      }
      grid.appendChild(card);
    });
  },

  renderShop: function(){
    var grid = document.getElementById('shop-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var s = JDR.SaveManager.data;
    var coinsEl = document.getElementById('shop-coins');
    if (coinsEl) coinsEl.textContent = s.coins;

    var self = this;
    JDR.DINOS.forEach(function(d){
      var card = document.createElement('div');
      card.className = 'clay-card dino-card' + (d.id === s.selectedDino ? ' selected' : '');

      var icon = document.createElement('div');
      icon.style.fontSize = '2.4rem';
      icon.style.margin = '4px 0';
      icon.textContent = d.id === 'pteranodon' ? '🦅' : (d.id === 'spino' ? '🐊' : (d.id === 'diplo' ? '🦕' : '🦖'));
      card.appendChild(icon);

      var h4 = document.createElement('h4');
      h4.textContent = d.name;
      card.appendChild(h4);

      var cat = document.createElement('div');
      cat.style.fontSize = '0.78rem';
      cat.style.color = '#7d6855';
      cat.style.marginBottom = '6px';
      cat.textContent = d.category || 'Dinosaur';
      card.appendChild(cat);

      var tag = document.createElement('div');
      tag.className = d.owned ? 'owned' : 'price';
      tag.textContent = d.owned ? (d.id === s.selectedDino ? '✓ Equipped' : 'Tamed') : '💎 ' + d.price;
      card.appendChild(tag);

      card.onclick = function(){
        self.selectDino(d);
      };

      grid.appendChild(card);
    });

    // Select currently equipped dino
    var currentDino = JDR.DINOS.find(function(d){ return d.id === s.selectedDino; }) || JDR.DINOS[0];
    this.selectDino(currentDino);
  },

  selectDino: function(d){
    var s = JDR.SaveManager.data;
    var nameEl = document.getElementById('preview-name');
    var descEl = document.getElementById('preview-desc');
    var statsEl = document.getElementById('preview-stats');
    var btn = document.getElementById('preview-btn');

    if (nameEl) nameEl.textContent = d.name;
    if (descEl) descEl.textContent = d.desc;

    // Rich 3D simulator stats
    if (statsEl) {
      var speedPct = Math.round((d.sprintSpeed3D / 28) * 100);
      var stamPct = Math.round((d.staminaMax3D / 150) * 100);
      var jumpPct = Math.round((d.jumpImpulse3D / 16) * 100);
      var massLabel = d.mass3D > 1000 ? (d.mass3D / 1000).toFixed(1) + ' Tons' : d.mass3D + ' kg';

      statsEl.innerHTML =
        '<div class="stat-bar"><label>Sprint Speed (' + Math.round(d.sprintSpeed3D * 3.6) + ' km/h)</label><div class="bar"><div class="bar-fill" style="width:' + speedPct + '%; background:#E98243"></div></div></div>' +
        '<div class="stat-bar"><label>Stamina Capacity</label><div class="bar"><div class="bar-fill" style="width:' + stamPct + '%; background:#527A46"></div></div></div>' +
        '<div class="stat-bar"><label>Leap Impulse</label><div class="bar"><div class="bar-fill" style="width:' + jumpPct + '%; background:#9CCFE0"></div></div></div>' +
        '<div style="display:flex; justify-content:space-between; margin-top:8px; font-weight:700; font-size:0.9rem; color:#63503f;">' +
        '<span>Mass: ' + massLabel + '</span>' +
        '<span>' + (d.canSwim ? '🏊 Swimmer' : (d.canFly ? '🪶 Flier' : 'Terrestrial')) + '</span>' +
        '</div>';
    }

    // Initialize 3D Turntable Preview
    this.setupShopPreview3D(d);

    if (btn) {
      btn.style.display = 'block';
      if (d.owned) {
        btn.textContent = d.id === s.selectedDino ? 'Equipped Mount ✓' : 'Equip for Safari';
        btn.className = 'btn ' + (d.id === s.selectedDino ? 'btn-jungle' : 'btn-primary');
        btn.onclick = function(){
          s.selectedDino = d.id;
          JDR.SaveManager.save();
          JDR.app.renderShop();
          JDR.Audio3D.playClayClick();
          if (JDR.HomeCinematic3D) JDR.HomeCinematic3D.refreshHeroDino();
        };
      } else {
        btn.textContent = 'Tame & Unlock (💎 ' + d.price + ')';
        btn.className = 'btn btn-volcano';
        btn.onclick = function(){
          if (s.coins >= d.price) {
            s.coins -= d.price;
            s.ownedDinos.push(d.id);
            d.owned = true;
            s.selectedDino = d.id;
            JDR.SaveManager.save();
            JDR.app.renderShop();
            JDR.Audio3D.playAmberCollect();
            if (JDR.HomeCinematic3D) JDR.HomeCinematic3D.refreshHeroDino();
          } else {
            alert('Need ' + (d.price - s.coins) + ' more Amber Gems to tame this dinosaur!');
          }
        };
      }
    }
  },

  setupShopPreview3D: function(dinoConfig){
    var previewCanvas = document.getElementById('preview-canvas');
    if (!previewCanvas) return;

    if (!this.previewRenderer) {
      this.previewRenderer = new THREE.WebGLRenderer({
        canvas: previewCanvas,
        antialias: true,
        alpha: true
      });
      this.previewRenderer.setSize(220, 180);
      this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      this.previewRenderer.outputEncoding = THREE.sRGBEncoding;

      this.previewScene = new THREE.Scene();
      this.previewCamera = new THREE.PerspectiveCamera(45, 220 / 180, 0.1, 50);
      this.previewCamera.position.set(0, 3.2, 7.5);
      this.previewCamera.lookAt(0, 1.2, 0);

      var light = new THREE.DirectionalLight(0xffe0a0, 2.2);
      light.position.set(5, 8, 5);
      this.previewScene.add(light);
      var amb = new THREE.AmbientLight(0x274a63, 0.9);
      this.previewScene.add(amb);
      var rim = new THREE.DirectionalLight(0x65bceb, 1.4);
      rim.position.set(-5, 4, -5);
      this.previewScene.add(rim);
    }

    if (this.previewDinoMesh) {
      this.previewScene.remove(this.previewDinoMesh);
    }

    var dinoObj = JDR.Dino3D.createDinosaurMesh(dinoConfig);
    this.previewDinoMesh = dinoObj.root;
    this.previewScene.add(this.previewDinoMesh);

    var self = this;
    if (this.previewAnimId) cancelAnimationFrame(this.previewAnimId);

    var animLoop = function(){
      if (self.currentScreen !== 'shop-screen') return;
      self.previewAnimId = requestAnimationFrame(animLoop);
      if (self.previewDinoMesh) {
        self.previewDinoMesh.rotation.y += 0.015;
      }
      self.previewRenderer.render(self.previewScene, self.previewCamera);
    };
    animLoop();
  },

  renderScores: function(){
    var s = JDR.SaveManager.data;
    var statAmber = document.getElementById('stat-amber');
    var statDinos = document.getElementById('stat-dinos');
    var statMaps = document.getElementById('stat-maps');

    if (statAmber) statAmber.textContent = s.coins;
    if (statDinos) statDinos.textContent = (s.ownedDinos ? s.ownedDinos.length : 1) + ' / 9';
    if (statMaps) statMaps.textContent = (s.unlockedMaps ? s.unlockedMaps.length : 2) + ' / 5';

    var body = document.getElementById('scores-body');
    if (!body) return;
    body.innerHTML = '';
    var hs = s.highScores || [];
    if (!hs.length) {
      body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px; color:#88725e;">No scores logged yet! Play a match to set records.</td></tr>';
      return;
    }
    hs.forEach(function(score, i){
      var tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(0,0,0,0.06)';
      tr.innerHTML = '<td style="padding:10px 8px; font-weight:700;">' + (i + 1) + '</td>' +
        '<td style="color:#d98822; font-family:Orbitron; font-weight:800;">' + score.score + '</td>' +
        '<td style="font-weight:600;">' + score.map + '</td>' +
        '<td>' + score.dino + '</td>' +
        '<td style="color:#88725e; font-size:0.9rem;">' + score.date + '</td>';
      body.appendChild(tr);
    });
  },

  loadSettings: function(){
    var s = JDR.SaveManager.data.settings;
    var setMusic = document.getElementById('set-music');
    var setMusicVal = document.getElementById('set-music-val');
    var setSfx = document.getElementById('set-sfx');
    var setSfxVal = document.getElementById('set-sfx-val');
    var setCamDist = document.getElementById('set-cam-dist');

    if (setMusic) setMusic.value = s.musicVol;
    if (setMusicVal) setMusicVal.textContent = s.musicVol + '%';
    if (setSfx) setSfx.value = s.sfxVol;
    if (setSfxVal) setSfxVal.textContent = s.sfxVol + '%';
    if (setCamDist) setCamDist.value = s.cameraDistance || 7.5;
  },

  updateSetting: function(key, val){
    var s = JDR.SaveManager.data.settings;
    if (key === 'musicVol') {
      s.musicVol = parseInt(val);
      JDR.Audio3D.setVolumes(s.sfxVol, s.musicVol);
      document.getElementById('set-music-val').textContent = val + '%';
    } else if (key === 'sfxVol') {
      s.sfxVol = parseInt(val);
      JDR.Audio3D.setVolumes(s.sfxVol, s.musicVol);
      document.getElementById('set-sfx-val').textContent = val + '%';
    } else if (key === 'cameraDistance') {
      s.cameraDistance = parseFloat(val);
      JDR.CONFIG.SIM_3D.CAMERA_DEFAULT_DISTANCE = s.cameraDistance;
    } else if (key === 'graphicsQuality') {
      s.graphicsQuality = val;
    }
    JDR.SaveManager.save();
  },

  resetProgress: function(){
    if (confirm('Reset all exploration progress and currency? This cannot be undone!')) {
      JDR.SaveManager.reset();
      this.showScreen('main-menu');
    }
  },

  // ==================== MULTIPLAYER ACTIONS ====================
  createMultiplayerRoom: function(){
    var code = 'DINO' + Math.floor(Math.random() * 89 + 10);
    var input = document.getElementById('room-code-input');
    if (input) input.value = code;

    var self = this;
    JDR.Multiplayer3D.init(code, true, function(players){
      self.updatePlayerListUI(players);
    });

    var launchBtn = document.getElementById('btn-launch-multi');
    if (launchBtn) launchBtn.style.display = 'block';
  },

  joinMultiplayerRoom: function(){
    var input = document.getElementById('room-code-input');
    var code = input ? input.value.trim() : '';
    if (!code) {
      alert('Please enter a room code!');
      return;
    }

    var self = this;
    JDR.Multiplayer3D.init(code, false, function(players){
      self.updatePlayerListUI(players);
    });

    var launchBtn = document.getElementById('btn-launch-multi');
    if (launchBtn) launchBtn.style.display = 'block';
  },

  updatePlayerListUI: function(players){
    var listEl = document.getElementById('multiplayer-player-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    players.forEach(function(p){
      var item = document.createElement('div');
      item.className = 'player-item';
      item.innerHTML = '<span>🦖 ' + p.name + '</span><span class="clay-badge">' + (p.isLocal ? 'YOU' : 'READY') + '</span>';
      listEl.appendChild(item);
    });
  },

  startMultiplayerGame: function(){
    this.start3DSimulation({ multiplayer: true });
  },

  // ==================== CONTROLS & RESPONSIVE SETUP ====================
  setupControls: function(){
    var self = this;
    window.addEventListener('keydown', function(e){
      if (self.currentScreen === 'main-menu' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        self.start3DSimulation({ freeRoam: true });
      }
    });

    // Listen to Fullscreen changes across all browser vendor variants
    var fsChangeEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    fsChangeEvents.forEach(function(evt){
      document.addEventListener(evt, function(){
        self.onFullscreenChanged();
      });
    });

    // Orientation checking for mobile gameplay
    window.addEventListener('resize', function(){
      self.checkOrientationPrompt();
    });
    window.addEventListener('orientationchange', function(){
      setTimeout(function(){
        self.checkOrientationPrompt();
      }, 150);
    });
  },

  checkOrientationPrompt: function(){
    var promptEl = document.getElementById('orientation-prompt');
    if (!promptEl) return;
    var isGameActive = (this.currentScreen === 'game-3d-screen' || this.currentScreen === 'game-screen');
    var isPortrait = window.innerHeight > window.innerWidth;
    var isMobileWidth = window.innerWidth < 900;

    if (isGameActive && isPortrait && isMobileWidth) {
      promptEl.style.display = 'flex';
      document.body.classList.add('show-orientation-prompt');
    } else {
      promptEl.style.display = 'none';
      document.body.classList.remove('show-orientation-prompt');
    }
  },

  onFullscreenChanged: function(){
    var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    if (isFs) {
      document.body.classList.add('is-fullscreen');
    } else {
      document.body.classList.remove('is-fullscreen');
    }

    var hudBtn = document.getElementById('hud-btn-fullscreen');
    if (hudBtn) hudBtn.textContent = isFs ? '✕' : '⛶';

    var pauseBtn = document.getElementById('pause-btn-fullscreen');
    if (pauseBtn) pauseBtn.textContent = isFs ? '✕ Exit Fullscreen' : '⛶ Fullscreen';

    // Trigger canvas & camera aspect resize
    setTimeout(function(){
      if (JDR.simEngine) JDR.simEngine.onWindowResize();
    }, 100);
  },

  toggleFullscreen: function(){
    var doc = document.documentElement;
    var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

    if (!isFs) {
      var requestMethod = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.mozRequestFullScreen || doc.msRequestFullscreen;
      if (requestMethod) {
        requestMethod.call(doc).catch(function(e){
          console.warn('Fullscreen request rejected:', e);
        });
      }
      // Attempt screen orientation lock on supported mobile browsers
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(function(){});
      }
    } else {
      var exitMethod = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
      if (exitMethod) {
        exitMethod.call(document);
      }
    }
  }
};

window.addEventListener('DOMContentLoaded', function(){
  JDR.app.init();
});
