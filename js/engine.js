var JDR=window.JDR||{};
JDR.SaveManager={
  data:null,
  load:function(){try{this.data=JSON.parse(localStorage.getItem('jdr_save'))||null;}catch(e){}
    if(!this.data)this.data=JSON.parse(JSON.stringify(JDR.DEFAULT_SAVE));this.apply();},
  save:function(){try{localStorage.setItem('jdr_save',JSON.stringify(this.data));}catch(e){}},
  apply:function(){var d=this.data;JDR.DINOS.forEach(function(di){di.owned=d.ownedDinos.indexOf(di.id)>=0;});
    JDR.MAPS.forEach(function(m){m.unlocked=d.unlockedMaps.indexOf(m.id)>=0;});},
  addCoins:function(n){this.data.coins+=n;this.save();},
  reset:function(){localStorage.removeItem('jdr_save');this.load();}
};

JDR.engine={
  canvas:null,ctx:null,running:false,paused:false,gameOver:false,
  players:[],obstacles:[],coins:[],powerups:[],enemies:[],
  speed:0,score:0,combo:0,comboTimer:0,distance:0,
  nextObstacle:0,nextCoin:0,nextPowerup:0,nextEnemy:0,
  frameCount:0,mode:1,map:null,shakeX:0,shakeY:0,shakeT:0,
  coinsCollected:0,activePowerup:null,powerupTimer:0,lives:1,

  init:function(){
    this.canvas=document.getElementById('game-canvas');
    this.ctx=this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize',this.resize.bind(this));
  },

  resize:function(){
    var W=window.innerWidth,H=window.innerHeight;
    JDR.CONFIG.CANVAS_W = W;
    JDR.CONFIG.CANVAS_H = H;
    JDR.CONFIG.GROUND_Y = H - Math.min(100, H * 0.15); // Adjust ground based on height
    
    this.canvas.width=W;this.canvas.height=H;
    this.canvas.style.width=W+'px';this.canvas.style.height=H+'px';
    this.canvas.style.marginTop='0px';
    this.canvas.style.marginLeft='0px';
    
    if (this.players) {
      var gy = JDR.CONFIG.GROUND_Y;
      this.players.forEach(function(p){
        var oldBase = p.baseY;
        p.baseY = gy - p.dino.h - p.dino.legLen;
        if (!p.jumping) p.y = p.baseY;
        else p.y += (p.baseY - oldBase);
      });
    }
  },

  start:function(mode){
    this.mode=mode;var s=JDR.SaveManager.data;
    this.map=JDR.MAPS.find(function(m){return m.id===s.selectedMap;})||JDR.MAPS[0];
    this.speed=JDR.CONFIG.BASE_SPEED;this.score=0;this.combo=0;this.comboTimer=0;
    this.distance=0;this.frameCount=0;this.gameOver=false;this.paused=false;
    this.obstacles=[];this.coins=[];this.powerups=[];this.enemies=[];
    this.nextObstacle=500;this.nextCoin=150;this.nextPowerup=800;this.nextEnemy=800;
    this.coinsCollected=0;this.activePowerup=null;this.powerupTimer=0;this.lives=1;
    this.shakeX=0;this.shakeY=0;this.shakeT=0;
    JDR.Background.reset();JDR.Particles.clear();
    var dconf=JDR.DINOS.find(function(d){return d.id===s.selectedDino;})||JDR.DINOS[0];
    var gy=JDR.CONFIG.GROUND_Y;
    this.players=[this.makePlayer(dconf,80,gy,mode===2?1:0)];
    if(mode===2){
      var d2=JDR.DINOS.find(function(d){return d.id!==s.selectedDino&&d.owned;})||JDR.DINOS[0];
      this.players.push(this.makePlayer(d2,40,gy,2));
    }
    document.getElementById('game-over-overlay').style.display='none';
    document.getElementById('pause-overlay').style.display='none';
    document.getElementById('p1-label').style.display=mode===2?'block':'none';
    document.getElementById('p2-label').style.display=mode===2?'block':'none';
    JDR.Audio.play('click');this.running=true;this.loop();
  },

  makePlayer:function(d,x,gy,pn){
    return{dino:d,x:x,y:gy-d.h-d.legLen,baseY:gy-d.h-d.legLen,vy:0,
      jumping:false,canDouble:true,ducking:false,dead:false,
      frame:0,state:'run',hurtTimer:0,shieldActive:false,pNum:pn,
      hitbox:{x:x+8,y:gy-d.h-d.legLen+5,w:d.w-16,h:d.h+d.legLen-10}};
  },

  loop:function(){
    if(!this.running)return;
    if(!this.paused&&!this.gameOver){this.update();this.render();}
    requestAnimationFrame(this.loop.bind(this));
  },

  update:function(){
    var C=JDR.CONFIG,dt=C.DIFFICULTY[JDR.SaveManager.data.settings.difficulty]||1;
    this.frameCount++;this.distance+=this.speed;
    this.score=Math.floor(this.distance/10);
    var speedSteps = Math.floor(this.score / 1000);
    this.speed=Math.min(C.MAX_SPEED, C.BASE_SPEED + (speedSteps * C.SPEED_INCREMENT * dt));
    if(this.score%100===0&&this.score>0&&this.frameCount%60===0)JDR.Audio.play('milestone');
    if(this.comboTimer>0){this.comboTimer--;if(this.comboTimer<=0)this.combo=0;}
    if(this.powerupTimer>0){this.powerupTimer--;if(this.powerupTimer<=0)this.activePowerup=null;}
    if(this.shakeT>0)this.shakeT--;

    // Weather particles
    if(this.frameCount%3===0)JDR.Particles.emitWeather(this.map,C.CANVAS_W,C.CANVAS_H);

    // Players
    var self=this;
    this.players.forEach(function(p){
      if(p.dead)return;
      p.frame++;
      // gravity
      if(p.jumping){p.vy+=C.GRAVITY;p.y+=p.vy;
        if(p.y>=p.baseY){p.y=p.baseY;p.jumping=false;p.vy=0;p.canDouble=true;p.state='run';JDR.Audio.play('land');}
        else p.state='jump';
      }
      if(p.ducking&&!p.jumping)p.state='duck';
      else if(!p.jumping)p.state='run';
      if(p.hurtTimer>0){p.hurtTimer--;p.state='hurt';}
      // dust
      if(!p.jumping&&p.state==='run'&&self.frameCount%4===0)
        JDR.Particles.emitDust(p.x,p.baseY+p.dino.h+p.dino.legLen,self.map.groundColor);
      // hitbox
      var duckOff=p.ducking?15:0;
      var hW = p.dino.w * 0.6; 
      var hH = p.ducking ? p.dino.h * 0.4 : p.dino.h * 0.8;
      p.hitbox={
        x: p.x + (p.dino.w - hW) * 0.5 + 5, 
        y: p.y + (p.dino.h - hH) * 0.5 + duckOff, 
        w: hW - 10, 
        h: hH + p.dino.legLen - 15 - duckOff
      };
    });

    // --- Simplified Spawn Logic for High Spacing & Fairness ---
    this.nextObstacle -= this.speed;
    this.nextEnemy -= this.speed;

    if(this.nextObstacle <= 0){
      var C_W = C.CANVAS_W;
      var spawnType = Math.random();
      
      if(spawnType < 0.7){ 
        // Single Ground Obstacle
        var oh=25+Math.random()*25, ow=15+Math.random()*15;
        this.obstacles.push({x:C_W+20,y:C.GROUND_Y-oh,w:ow,h:oh,type:Math.floor(Math.random()*4),flying:false,passed:false});
      } else {
        // Single Flying Obstacle (duckable)
        var oh=15+Math.random()*10, ow=30+Math.random()*15;
        var flyH = C.GROUND_Y - 55 - Math.random()*25;
        this.obstacles.push({x:C_W+20,y:flyH,w:ow,h:oh,type:Math.floor(Math.random()*4),flying:true,passed:false});
      }
      
      // Enforce large gap
      var gap = C.OBSTACLE_MIN_GAP + Math.random()*(C.OBSTACLE_MAX_GAP - C.OBSTACLE_MIN_GAP);
      this.nextObstacle = gap;
      this.nextEnemy = Math.max(this.nextEnemy, gap * 0.5); // Push enemy back
    }

    // Spawn coins
    this.nextCoin -= this.speed;
    if(this.nextCoin <= 0){
      var count = 3 + Math.floor(Math.random()*3);
      var cy = C.GROUND_Y-40-Math.random()*60;
      for(var ci=0; ci<count; ci++){
        this.coins.push({x:C.CANVAS_W+20+ci*25,y:cy,size:10,collected:false,sparkle:ci*5});
      }
      this.nextCoin = 400 + Math.random()*600;
    }

    // Spawn powerups
    this.nextPowerup -= this.speed;
    if(this.nextPowerup <= 0){
      var pu = JDR.POWERUPS[Math.floor(Math.random()*JDR.POWERUPS.length)];
      this.powerups.push({x:C.CANVAS_W+20,y:C.GROUND_Y-80,type:pu,size:14,collected:false});
      this.nextPowerup = 1500 + Math.random()*1500;
    }

    // Spawn enemies (Pteranodons) - Only if far from obstacles
    if(this.nextEnemy <= 0 && this.nextObstacle > 500){
      var ey = C.GROUND_Y-80-Math.random()*80;
      this.enemies.push({x:C.CANVAS_W+30,y:ey,w:30,h:20,vx:-1-Math.random()*2,vy:0,frame:0,type:'ptero'});
      var gap = C.ENEMY_MIN_INTERVAL + Math.random()*1000;
      this.nextEnemy = gap;
      this.nextObstacle = Math.max(this.nextObstacle, 500); // Push obstacle back
    }

    // Move obstacles
    for(var i=this.obstacles.length-1;i>=0;i--){
      var o=this.obstacles[i];o.x-=this.speed+(this.activePowerup==='slow'?-this.speed*0.4:0);
      if(o.x+o.w<0){this.obstacles.splice(i,1);continue;}
      if(!o.passed&&o.x+o.w<this.players[0].x){
        o.passed=true;this.combo++;this.comboTimer=90;
      }
    }
    // Move coins
    for(var i=this.coins.length-1;i>=0;i--){
      var c=this.coins[i];c.x-=this.speed;c.sparkle++;
      if(c.x<-20){this.coins.splice(i,1);continue;}
      if(!c.collected){
        this.players.forEach(function(p){
          if(!p.dead&&self.rectOverlap(p.hitbox,{x:c.x-c.size,y:c.y-c.size,w:c.size*2,h:c.size*2})){
            c.collected=true;self.coinsCollected+=C.COIN_VALUE;
            JDR.Audio.play('coin');JDR.Particles.emitCoinCollect(c.x,c.y);
          }
        });
      }
    }
    // Move powerups
    for(var i=this.powerups.length-1;i>=0;i--){
      var pu=this.powerups[i];pu.x-=this.speed;
      if(pu.x<-20){this.powerups.splice(i,1);continue;}
      if(!pu.collected){
        this.players.forEach(function(p){
          if(!p.dead&&self.rectOverlap(p.hitbox,{x:pu.x-pu.size,y:pu.y-pu.size,w:pu.size*2,h:pu.size*2})){
            pu.collected=true;self.applyPowerup(pu.type,p);JDR.Audio.play('powerup');
          }
        });
      }
    }
    // Move enemies
    for(var i=this.enemies.length-1;i>=0;i--){
      var e=this.enemies[i];e.x+=e.vx-this.speed*0.3;e.y+=Math.sin(e.frame*0.05)*0.8;e.frame++;
      if(e.x<-50){this.enemies.splice(i,1);continue;}
    }

    // Collisions
    this.players.forEach(function(p){
      if(p.dead||p.hurtTimer>0||self.activePowerup==='shield')return;
      // obstacles
      for(var i=0;i<self.obstacles.length;i++){
        var o=self.obstacles[i];
        if(self.rectOverlap(p.hitbox,{x:o.x,y:o.y,w:o.w,h:o.h})){self.hitPlayer(p);break;}
      }
      // enemies
      for(var i=0;i<self.enemies.length;i++){
        var e=self.enemies[i];
        if(self.rectOverlap(p.hitbox,{x:e.x,y:e.y,w:e.w,h:e.h})){self.hitPlayer(p);break;}
      }
    });

    JDR.Particles.update();
    // HUD
    var bonus=this.combo>=C.COMBO_THRESHOLD?Math.floor(this.combo*C.COMBO_MULTIPLIER):0;
    var totalScore=this.score+bonus+(this.activePowerup==='double'?this.score:0);
    document.getElementById('hud-score').textContent=totalScore;
    document.getElementById('hud-coins').textContent=this.coinsCollected;
    var hiEl=document.getElementById('hud-hi');
    var hi=0;JDR.SaveManager.data.highScores.forEach(function(s){if(s.score>hi)hi=s.score;});
    hiEl.textContent=Math.max(hi,totalScore);
    if(this.combo>=C.COMBO_THRESHOLD){
      document.getElementById('hud-combo').style.display='block';
      document.getElementById('hud-combo-val').textContent=this.combo;
    }else document.getElementById('hud-combo').style.display='none';
  },

  hitPlayer:function(p){
    if(this.activePowerup==='shield'){this.activePowerup=null;this.powerupTimer=0;return;}
    this.lives--;JDR.Audio.play('hit');JDR.Particles.emitHit(p.x+p.dino.w/2,p.y+p.dino.h/2);
    this.shake();
    if(this.lives<=0){p.dead=true;p.state='hurt';this.endGame();}
    else{p.hurtTimer=60;}
  },

  applyPowerup:function(pu,p){
    if(pu.id==='life'){this.lives++;return;}
    this.activePowerup=pu.id;this.powerupTimer=JDR.CONFIG.POWERUP_DURATION;
    document.getElementById('hud-powerup').style.display='flex';
    document.getElementById('hud-powerup-icon').textContent=pu.icon;
  },

  shake:function(){
    if(!JDR.SaveManager.data.settings.screenShake)return;
    this.shakeT=15;
  },

  endGame:function(){
    this.gameOver=true;JDR.Audio.play('gameOver');
    document.getElementById('game-screen').classList.remove('game-active');
    var bonus=this.combo>=JDR.CONFIG.COMBO_THRESHOLD?Math.floor(this.combo*JDR.CONFIG.COMBO_MULTIPLIER):0;
    var finalScore=this.score+bonus;
    JDR.SaveManager.addCoins(this.coinsCollected);
    var hs=JDR.SaveManager.data.highScores;
    var isNew=hs.length<10||hs.some(function(s){return finalScore>s.score;});
    hs.push({score:finalScore,map:this.map.name,dino:this.players[0].dino.name,
      date:new Date().toLocaleDateString()});
    hs.sort(function(a,b){return b.score-a.score;});
    if(hs.length>10)hs.length=10;
    JDR.SaveManager.data.totalGames++;JDR.SaveManager.save();
    document.getElementById('go-score').textContent=finalScore;
    var best=0;hs.forEach(function(s){if(s.score>best)best=s.score;});
    document.getElementById('go-best').textContent=best;
    document.getElementById('go-coins').textContent='+'+this.coinsCollected;
    document.getElementById('go-new-best').style.display=finalScore>=best?'block':'none';
    document.getElementById('game-over-overlay').style.display='flex';
  },

  restart:function(){
    document.getElementById('game-over-overlay').style.display='none';
    this.start(this.mode);
  },

  quit:function(){
    this.running=false;this.paused=false;
    document.getElementById('game-screen').classList.remove('game-active');
    document.getElementById('game-over-overlay').style.display='none';
    document.getElementById('pause-overlay').style.display='none';
    JDR.app.showScreen('main-menu');
  },

  pause:function(){this.paused=true;document.getElementById('pause-overlay').style.display='flex';},
  resume:function(){this.paused=false;document.getElementById('pause-overlay').style.display='none';},

  render:function(){
    var ctx=this.ctx,W=JDR.CONFIG.CANVAS_W,H=JDR.CONFIG.CANVAS_H;
    ctx.save();
    if(this.shakeT>0){
      this.shakeX=(Math.random()-0.5)*this.shakeT*0.8;
      this.shakeY=(Math.random()-0.5)*this.shakeT*0.5;
      ctx.translate(this.shakeX,this.shakeY);
    }
    // Background
    JDR.Background.draw(ctx,this.map,W,H,this.speed);
    var gy=JDR.CONFIG.GROUND_Y;

    // Coins
    var self=this;
    this.coins.forEach(function(c){
      if(c.collected)return;
      ctx.save();ctx.translate(c.x,c.y);
      var scale = Math.abs(Math.cos(c.sparkle*0.08));
      var isEdge = scale < 0.2;
      
      // Outer ring
      ctx.fillStyle = isEdge ? '#b8860b' : '#ffd700';
      ctx.beginPath();
      ctx.ellipse(0, 0, c.size * scale, c.size, 0, 0, Math.PI*2);
      ctx.fill();
      
      if (!isEdge) {
        // Inner detail
        ctx.fillStyle = '#ffdf00';
        ctx.beginPath();
        ctx.ellipse(0, 0, c.size * scale * 0.7, c.size * 0.7, 0, 0, Math.PI*2);
        ctx.fill();
        // Edge highlighting
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, c.size * scale * 0.7, c.size * 0.7, 0, 0, Math.PI*2);
        ctx.stroke();
        
        ctx.fillStyle='#b8860b';ctx.font='bold 10px "Cinzel Decorative", serif';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText('J', 0, 1);
      }
      ctx.restore();
    });

    // Powerups
    this.powerups.forEach(function(pu){
      if(pu.collected)return;
      ctx.save();ctx.translate(pu.x,pu.y);
      var glow=0.5+Math.sin(self.frameCount*0.1)*0.3;
      ctx.shadowColor=pu.type.color;ctx.shadowBlur=15*glow;
      ctx.fillStyle=pu.type.color;ctx.globalAlpha=0.3;
      ctx.beginPath();ctx.arc(0,0,pu.size+4,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;ctx.font='16px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(pu.type.icon,0,1);ctx.restore();
    });

    // Obstacles
    this.obstacles.forEach(function(o){
      ctx.save();
      ctx.translate(o.x, o.y);
      
      if(o.flying){
        // === FLYING OBSTACLE (duck under) — thorny vine / hanging rock ===
        if(o.type % 2 === 0){
          // Thorny vine
          ctx.strokeStyle = '#66bb6a'; // Brighter green
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(o.w/2, -30);
          ctx.quadraticCurveTo(o.w/2+8, -10, o.w/2, 0);
          ctx.stroke();
          
          // Vine leaves
          ctx.fillStyle = '#81c784';
          ctx.beginPath();
          ctx.ellipse(o.w/2-6, -15, 6, 3, -0.5, 0, Math.PI*2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(o.w/2+7, -8, 5, 3, 0.4, 0, Math.PI*2);
          ctx.fill();
          
          // Main body — thorny cluster
          ctx.fillStyle = '#aed581';
          ctx.beginPath();
          ctx.ellipse(o.w/2, o.h/2, o.w/2+4, o.h/2+2, 0, 0, Math.PI*2);
          ctx.fill();
          
          // Thorns
          ctx.fillStyle = '#ff7043'; // Bright orange thorns
          for(var ti=0; ti<6; ti++){
            var ang = ti * Math.PI / 3;
            var tx = o.w/2 + Math.cos(ang) * (o.w/2+2);
            var ty = o.h/2 + Math.sin(ang) * (o.h/2+1);
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + Math.cos(ang)*10, ty + Math.sin(ang)*10);
            ctx.lineTo(tx + Math.cos(ang+0.3)*4, ty + Math.sin(ang+0.3)*4);
            ctx.fill();
          }
        } else {
          // Hanging stalactite / rock
          ctx.fillStyle = '#a0a0a0'; // Brighter grey
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(o.w*0.3, 0);
          ctx.lineTo(o.w*0.2, o.h*0.8);
          ctx.lineTo(o.w*0.1, o.h);
          ctx.lineTo(0, o.h*0.6);
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(o.w*0.4, 0);
          ctx.lineTo(o.w*0.8, 0);
          ctx.lineTo(o.w*0.7, o.h);
          ctx.lineTo(o.w*0.5, o.h*0.7);
          ctx.fill();
          
          ctx.beginPath();
          ctx.moveTo(o.w*0.7, 0);
          ctx.lineTo(o.w, 0);
          ctx.lineTo(o.w*0.9, o.h*0.5);
          ctx.fill();
          
          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.4)'; // Brighter highlight
          ctx.beginPath();
          ctx.moveTo(o.w*0.15, 0);
          ctx.lineTo(o.w*0.25, 0);
          ctx.lineTo(o.w*0.18, o.h*0.5);
          ctx.fill();
        }
        
        // Warning indicator — subtle red glow
        ctx.fillStyle = 'rgba(255,80,80,0.1)';
        ctx.beginPath();
        ctx.ellipse(o.w/2, o.h/2, o.w/2+10, o.h/2+10, 0, 0, Math.PI*2);
        ctx.fill();
      } else if(o.type===0){// cactus
        ctx.fillStyle = '#66bb6a'; // Brighter green
        var cx = o.w/2;
        // Main trunk
        ctx.fillRect(cx - 6, 0, 12, o.h);
        ctx.beginPath(); ctx.arc(cx, 0, 6, 0, Math.PI*2); ctx.fill();
        // Arms
        if (o.h > 30) {
          ctx.fillRect(cx - 14, o.h*0.3, 10, 8);
          ctx.fillRect(cx - 14, o.h*0.1, 8, o.h*0.2);
          ctx.beginPath(); ctx.arc(cx - 10, o.h*0.1, 4, 0, Math.PI*2); ctx.fill();
          
          ctx.fillRect(cx + 4, o.h*0.4, 12, 8);
          ctx.fillRect(cx + 8, o.h*0.2, 8, o.h*0.2);
          ctx.beginPath(); ctx.arc(cx + 12, o.h*0.2, 4, 0, Math.PI*2); ctx.fill();
        }
        // Spikes
        ctx.fillStyle = '#c5e1a5'; // Lighter spikes
        for(var i=10; i<o.h-5; i+=8) {
          ctx.fillRect(cx - 8, i, 3, 1);
          ctx.fillRect(cx + 5, i+4, 3, 1);
        }
      }else if(o.type===1){// rock
        var grd = ctx.createLinearGradient(0, 0, o.w, o.h);
        grd.addColorStop(0, '#d0d0d0'); // Brighter light grey
        grd.addColorStop(1, '#606060'); // Medium grey instead of dark
        ctx.fillStyle = grd;
        
        ctx.beginPath();
        ctx.moveTo(0, o.h);
        ctx.lineTo(o.w*0.2, o.h*0.3);
        ctx.lineTo(o.w*0.5, o.h*0.1);
        ctx.lineTo(o.w*0.8, o.h*0.4);
        ctx.lineTo(o.w, o.h);
        ctx.closePath();
        ctx.fill();
        
        // Highlights/facets
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; // More opaque highlight
        ctx.beginPath();
        ctx.moveTo(o.w*0.2, o.h*0.3);
        ctx.lineTo(o.w*0.5, o.h*0.1);
        ctx.lineTo(o.w*0.4, o.h);
        ctx.fill();
      }else if(o.type===2){// bone
        ctx.fillStyle = '#ffffff'; // Pure white for bones
        ctx.strokeStyle = '#aaaaaa'; // Add an outline
        ctx.lineWidth = 1;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        
        // Center the bone and angle it
        ctx.translate(o.w/2, o.h/2);
        ctx.rotate(Math.PI/6);
        var bw = o.w * 0.8;
        
        // Main shaft
        ctx.fillRect(-bw/2, -4, bw, 8);
        
        // Ends
        ctx.beginPath(); ctx.arc(-bw/2, -4, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(-bw/2, 4, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(bw/2, -4, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(bw/2, 4, 5, 0, Math.PI*2); ctx.fill();
      }else{// log
        ctx.fillStyle = '#8d6e63'; // Brighter brown
        // Log body
        ctx.fillRect(0, o.h*0.4, o.w, o.h*0.6);
        ctx.beginPath(); ctx.arc(0, o.h*0.7, o.h*0.3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(o.w, o.h*0.7, o.h*0.3, 0, Math.PI*2); ctx.fill();
        
        // Bark lines
        ctx.strokeStyle = '#5d4037'; // Lighter bark lines
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(5, o.h*0.5); ctx.lineTo(o.w-5, o.h*0.5);
        ctx.moveTo(5, o.h*0.7); ctx.lineTo(o.w-5, o.h*0.7);
        ctx.moveTo(5, o.h*0.9); ctx.lineTo(o.w-5, o.h*0.9);
        ctx.stroke();
        
        // Side cut showing wood rings
        ctx.fillStyle = '#efebe9'; // Very bright side cut
        ctx.beginPath();
        ctx.ellipse(o.w, o.h*0.7, o.w*0.1, o.h*0.3, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#8b6b4a';
        ctx.ellipse(o.w, o.h*0.7, o.w*0.05, o.h*0.15, 0, 0, Math.PI*2);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Enemies (Pteranodons)
    this.enemies.forEach(function(e){
      ctx.save();ctx.translate(e.x,e.y);
      
      var pColor = '#c46a2a'; // Orange-brown leathery
      var pDark = '#8b4a1a';
      var pHighlight = '#e0a050';
      
      // Body
      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.ellipse(15, 12, 14, 7, -0.1, 0, Math.PI*2);
      ctx.fill();
      
      // Wings animation
      var flap = Math.sin(e.frame*0.3);
      var wingY = flap * 22;
      var wingMidY = flap * 12;
      
      // Back Wing
      ctx.fillStyle = pDark;
      ctx.beginPath();
      ctx.moveTo(22, 10);
      ctx.bezierCurveTo(35, wingMidY-10, 50, wingY, 60, wingY+5);
      ctx.bezierCurveTo(45, wingY+15, 30, 20, 18, 14);
      ctx.fill();
      
      // Head & Crest (Pteranodon style)
      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.moveTo(25, 8); // neck
      ctx.lineTo(32, 5); // head top
      ctx.lineTo(12, -12); // Long crest back
      ctx.lineTo(28, 8); // crest bottom
      ctx.lineTo(55, 12); // Long sharp beak tip
      ctx.lineTo(40, 16); // beak bottom
      ctx.lineTo(28, 16); // neck bottom
      ctx.fill();
      
      // Eye
      ctx.fillStyle = '#000000';
      ctx.beginPath();ctx.arc(32, 9, 1.2, 0, Math.PI*2);ctx.fill();
      
      // Front Wing
      var wGrd = ctx.createLinearGradient(15, 10, 0, wingY);
      wGrd.addColorStop(0, pHighlight);
      wGrd.addColorStop(1, pColor);
      ctx.fillStyle = wGrd;
      ctx.beginPath();
      ctx.moveTo(12, 10);
      ctx.bezierCurveTo(0, wingMidY-10, -30, wingY, -45, wingY+5);
      ctx.bezierCurveTo(-25, wingY+15, 0, 20, 15, 14);
      ctx.fill();
      
      // Ground Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.ellipse(15, JDR.CONFIG.GROUND_Y - e.y + 10, 20, 4, 0, 0, Math.PI*2);
      ctx.fill();
      
      ctx.restore();
    });

    // Players
    this.players.forEach(function(p){
      if(p.dead&&self.frameCount%6<3)return;
      JDR.DinoRenderer.draw(ctx,p.dino,p.x,p.y,p.frame,p.state);
      if(self.activePowerup==='shield'){
        var isEnding = self.powerupTimer < 90; // Last 1.5 seconds
        if(!isEnding || self.frameCount % 10 < 7){
          ctx.strokeStyle='rgba(78,205,196,0.6)';
          ctx.lineWidth=3;
          ctx.beginPath();
          ctx.ellipse(p.x+p.dino.w/2,p.y+p.dino.h/2,p.dino.w*0.7,p.dino.h*0.8,0,0,Math.PI*2);
          ctx.stroke();
          // Inner glow
          ctx.strokeStyle='rgba(78,205,196,0.2)';
          ctx.lineWidth=6;
          ctx.stroke();
        }
      }
    });

    // Particles
    JDR.Particles.draw(ctx);

    // Ground details
    ctx.fillStyle='rgba(255,255,255,0.03)';
    for(var i=0;i<20;i++){
      var gx=(i*70-self.distance*0.5%70+70)%W;
      ctx.fillRect(gx,gy+5+i%3*8,20+i%4*10,1);
    }

    ctx.restore();
  },

  rectOverlap:function(a,b){
    return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  },

  jump:function(pIdx){
    var p=this.players[pIdx];if(!p||p.dead)return;
    if(!p.jumping){p.jumping=true;p.vy=-11*p.dino.jump;p.ducking=false;JDR.Audio.play('jump');}
    else if(p.canDouble){p.canDouble=false;p.vy=-9*p.dino.jump;JDR.Audio.play('doubleJump');}
  },
  duck:function(pIdx,on){
    var p=this.players[pIdx];if(!p||p.dead)return;
    p.ducking=on;if(on&&!p.jumping)JDR.Audio.play('duck');
  }
};
