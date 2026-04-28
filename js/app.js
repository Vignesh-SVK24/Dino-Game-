var JDR=window.JDR||{};
JDR.app={
  currentScreen:'loading-screen',

  init:function(){
    JDR.Audio.init();JDR.SaveManager.load();JDR.engine.init();
    this.setupControls();this.fakeLoad();
  },

  fakeLoad:function(){
    var bar=document.getElementById('loading-bar'),txt=document.getElementById('loading-text');
    var msgs=['Loading maps...','Spawning dinosaurs...','Growing vegetation...','Ready!'];
    var p=0,self=this;
    var iv=setInterval(function(){
      p+=Math.random()*15+5;if(p>100)p=100;
      bar.style.width=p+'%';txt.textContent=msgs[Math.min(Math.floor(p/30),3)];
      if(p>=100){clearInterval(iv);setTimeout(function(){self.showScreen('main-menu');},500);}
    },200);
  },

  showScreen:function(id){
    document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
    var el=document.getElementById(id);if(el){el.classList.add('active');el.style.display='flex';
      setTimeout(function(){el.style.opacity='1';},10);}
    document.querySelectorAll('.screen:not(.active)').forEach(function(s){s.style.opacity='0';
      setTimeout(function(){if(!s.classList.contains('active'))s.style.display='none';},400);});
    this.currentScreen=id;JDR.Audio.play('click');
    this.updateCoins();
    if(id==='main-menu')this.refreshMenu();
    if(id==='map-select')this.renderMaps();
    if(id==='shop-screen')this.renderShop();
    if(id==='scores-screen')this.renderScores();
    if(id==='settings-screen')this.loadSettings();
  },

  updateCoins:function(){
    var coins = JDR.SaveManager.data.coins;
    document.querySelectorAll('.coin-amount').forEach(function(el){
      el.textContent = coins;
    });
  },

  refreshMenu:function(){
    this.updateCoins();
  },

  startGame:function(mode){
    this.showScreen('game-screen');
    setTimeout(function(){JDR.engine.start(mode);},300);
  },

  renderMaps:function(){
    var grid=document.getElementById('map-grid');grid.innerHTML='';
    var sel=JDR.SaveManager.data.selectedMap;
    JDR.MAPS.forEach(function(m){
      var card=document.createElement('div');
      card.className='map-card'+(m.id===sel?' selected':'')+(m.unlocked?'':' locked');
      var cvs=document.createElement('canvas');cvs.width=320;cvs.height=200;
      var c=cvs.getContext('2d');
      // draw mini preview
      JDR.Background.reset();
      JDR.Background.draw(c,m,320,200,0);
      if (m.bgImage) {
        var img = new Image();
        img.src = m.bgImage;
        img.onload = function() { JDR.Background.draw(c,m,320,200,0); };
      }
      var info=document.createElement('div');info.className='map-card-info';
      info.innerHTML='<h4>'+m.name+'</h4><p>'+m.description+'</p>';
      card.appendChild(cvs);card.appendChild(info);
      if(!m.unlocked){
        var lock=document.createElement('div');lock.className='map-lock';
        lock.textContent='🔒 '+m.price+' coins';card.appendChild(lock);
        card.onclick=function(){
          if(JDR.SaveManager.data.coins>=m.price){
            JDR.SaveManager.data.coins-=m.price;
            JDR.SaveManager.data.unlockedMaps.push(m.id);m.unlocked=true;
            JDR.SaveManager.save();JDR.app.renderMaps();JDR.Audio.play('coin');
          }
        };
      }else{
        card.onclick=function(){
          JDR.SaveManager.data.selectedMap=m.id;JDR.SaveManager.save();
          JDR.app.renderMaps();JDR.Audio.play('click');
        };
      }
      grid.appendChild(card);
    });
  },

  renderShop:function(){
    var grid=document.getElementById('shop-grid');grid.innerHTML='';
    var s=JDR.SaveManager.data;
    document.getElementById('shop-coins').textContent=s.coins;
    var self=this;
    JDR.DINOS.forEach(function(d){
      var card=document.createElement('div');
      card.className='dino-card'+(d.id===s.selectedDino?' selected':'')+(d.owned?'':' locked');
      var cvs=document.createElement('canvas');cvs.width=80;cvs.height=80;
      var c=cvs.getContext('2d');
      JDR.DinoRenderer.draw(c,d,10,30,0,'run');
      card.appendChild(cvs);
      var h4=document.createElement('h4');h4.textContent=d.name;card.appendChild(h4);
      var tag=document.createElement('div');
      tag.className=d.owned?'owned':'price';
      tag.textContent=d.owned?(d.id===s.selectedDino?'✓ Equipped':'Owned'):'🪙 '+d.price;
      card.appendChild(tag);
      card.onclick=function(){self.selectDino(d);};
      grid.appendChild(card);
    });
  },

  selectDino:function(d){
    var s=JDR.SaveManager.data;
    var pvC=document.getElementById('preview-canvas').getContext('2d');
    pvC.clearRect(0,0,200,200);
    JDR.DinoRenderer.draw(pvC,d,50,80,0,'run');
    document.getElementById('preview-name').textContent=d.name;
    var stats='<div class="stat-bar"><label>Speed</label><div class="bar"><div class="bar-fill" style="width:'+
      (d.speed*75)+'%;background:#4ecdc4"></div></div></div>'+
      '<div class="stat-bar"><label>Jump</label><div class="bar"><div class="bar-fill" style="width:'+
      (d.jump*75)+'%;background:#f5a623"></div></div></div>'+
      '<div class="stat-bar"><label>Size</label><div class="bar"><div class="bar-fill" style="width:'+
      (d.size*60)+'%;background:#ff6b6b"></div></div></div>';
    document.getElementById('preview-stats').innerHTML=stats;
    var btn=document.getElementById('preview-btn');btn.style.display='block';
    if(d.owned){
      btn.textContent=d.id===s.selectedDino?'Equipped ✓':'Equip';
      btn.onclick=function(){s.selectedDino=d.id;JDR.SaveManager.save();JDR.app.renderShop();JDR.Audio.play('click');};
    }else{
      btn.textContent='Buy (🪙 '+d.price+')';
      btn.onclick=function(){
        if(s.coins>=d.price){s.coins-=d.price;s.ownedDinos.push(d.id);d.owned=true;
          s.selectedDino=d.id;JDR.SaveManager.save();JDR.app.renderShop();JDR.Audio.play('powerup');
        }
      };
    }
  },

  renderScores:function(){
    var body=document.getElementById('scores-body');body.innerHTML='';
    var hs=JDR.SaveManager.data.highScores;
    if(!hs.length){body.innerHTML='<tr><td colspan="5" style="text-align:center;color:#8899aa">No scores yet!</td></tr>';return;}
    hs.forEach(function(s,i){
      var tr=document.createElement('tr');
      tr.innerHTML='<td>'+(i+1)+'</td><td style="color:#ffd700;font-family:Orbitron">'+s.score+
        '</td><td>'+s.map+'</td><td>'+s.dino+'</td><td style="color:#8899aa">'+s.date+'</td>';
      body.appendChild(tr);
    });
  },

  loadSettings:function(){
    var s=JDR.SaveManager.data.settings;
    document.getElementById('set-music').value=s.musicVol;
    document.getElementById('set-music-val').textContent=s.musicVol+'%';
    document.getElementById('set-sfx').value=s.sfxVol;
    document.getElementById('set-sfx-val').textContent=s.sfxVol+'%';
    document.getElementById('set-difficulty').value=s.difficulty;
    document.getElementById('set-fps').checked=s.showFps;
    document.getElementById('set-shake').checked=s.screenShake;
    document.getElementById('set-particles').value=s.particles;
  },

  updateSetting:function(key,val){
    var s=JDR.SaveManager.data.settings;
    if(key==='musicVol'){s.musicVol=parseInt(val);JDR.Audio.setMusicVol(val);document.getElementById('set-music-val').textContent=val+'%';}
    if(key==='sfxVol'){s.sfxVol=parseInt(val);JDR.Audio.setSfxVol(val);document.getElementById('set-sfx-val').textContent=val+'%';}
    if(key==='difficulty')s.difficulty=val;
    if(key==='showFps')s.showFps=val;
    if(key==='screenShake')s.screenShake=val;
    if(key==='particles'){s.particles=val;JDR.Particles.setMax(val);}
    JDR.SaveManager.save();
  },

  resetProgress:function(){
    if(confirm('Reset all progress? This cannot be undone!')){JDR.SaveManager.reset();this.showScreen('main-menu');}
  },

  setupControls:function(){
    var self=this;
    document.addEventListener('keydown',function(e){
      if(self.currentScreen==='main-menu'&&e.code==='Space'){e.preventDefault();self.startGame(1);return;}
      if(self.currentScreen!=='game-screen')return;
      var eng=JDR.engine;if(eng.gameOver)return;
      if(e.code==='Escape'){e.preventDefault();eng.paused?eng.resume():eng.pause();return;}
      if(eng.paused)return;
      if(eng.mode===1){
        if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();eng.jump(0);}
        if(e.code==='ArrowDown'){e.preventDefault();eng.duck(0,true);}
      }else{
        if(e.code==='KeyW'){e.preventDefault();eng.jump(0);}
        if(e.code==='KeyS'){e.preventDefault();eng.duck(0,true);}
        if(e.code==='ArrowUp'){e.preventDefault();eng.jump(1);}
        if(e.code==='ArrowDown'){e.preventDefault();eng.duck(1,true);}
      }
    });
    document.addEventListener('keyup',function(e){
      if(self.currentScreen!=='game-screen')return;
      var eng=JDR.engine;
      if(eng.mode===1){if(e.code==='ArrowDown')eng.duck(0,false);}
      else{if(e.code==='KeyS')eng.duck(0,false);if(e.code==='ArrowDown')eng.duck(1,false);}
    });
    // Mobile Touch zones
    var mJump = document.getElementById('mobile-jump');
    var mDuck = document.getElementById('mobile-duck');
    
    var startJump = function(e){ e.preventDefault(); if(!JDR.engine.paused) JDR.engine.jump(0); };
    var startDuck = function(e){ e.preventDefault(); if(!JDR.engine.paused) JDR.engine.duck(0,true); };
    var stopDuck = function(e){ e.preventDefault(); JDR.engine.duck(0,false); };

    mJump.addEventListener('touchstart', startJump);
    mDuck.addEventListener('touchstart', startDuck);
    mDuck.addEventListener('touchend', stopDuck);
    
    // Global tap to jump (anywhere else on screen)
    document.getElementById('game-screen').addEventListener('touchstart', function(e){
      if(e.target === mJump || e.target === mDuck || mJump.contains(e.target) || mDuck.contains(e.target)) return;
      if(self.currentScreen==='game-screen' && !JDR.engine.paused) JDR.engine.jump(0);
    });
  },

  toggleFullscreen:function(){
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen().catch(function(e){
        console.error('Error entering fullscreen:',e);
      });
    }else{
      document.exitFullscreen();
    }
  }
};

window.addEventListener('DOMContentLoaded',function(){JDR.app.init();});
