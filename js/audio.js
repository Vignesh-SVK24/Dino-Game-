/* ==================== AUDIO MANAGER ==================== */
var JDR = window.JDR || {};

JDR.Audio = (function(){
  var ctx, master, musicGain, sfxGain;
  var initialized = false;

  function init(){
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      musicGain = ctx.createGain();
      sfxGain = ctx.createGain();
      musicGain.connect(master);
      sfxGain.connect(master);
      master.connect(ctx.destination);
      musicGain.gain.value = 0.7;
      sfxGain.gain.value = 0.8;
      initialized = true;
    } catch(e){ console.warn('Audio not available'); }
  }

  function resume(){ if(ctx && ctx.state==='suspended') ctx.resume(); }

  function setMusicVol(v){ if(musicGain) musicGain.gain.value = v/100; }
  function setSfxVol(v){ if(sfxGain) sfxGain.gain.value = v/100; }

  function playTone(freq, dur, type, vol, dest){
    if(!initialized) return;
    resume();
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.value = vol || 0.15;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(dest || sfxGain);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + dur);
  }

  function playNoise(dur, vol, dest){
    if(!initialized) return;
    resume();
    var bufSize = ctx.sampleRate * dur;
    var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for(var i=0;i<bufSize;i++) data[i] = Math.random()*2-1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var g = ctx.createGain();
    g.gain.value = vol || 0.1;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(g);
    g.connect(dest || sfxGain);
    src.start();
  }

  var sounds = {
    jump: function(){
      playTone(300, 0.15, 'square', 0.12);
      playTone(450, 0.1, 'square', 0.08);
    },
    doubleJump: function(){
      playTone(400, 0.1, 'square', 0.1);
      setTimeout(function(){ playTone(600, 0.12, 'square', 0.1); }, 50);
    },
    land: function(){ playNoise(0.08, 0.06); },
    coin: function(){
      playTone(800, 0.08, 'sine', 0.1);
      setTimeout(function(){ playTone(1200, 0.1, 'sine', 0.08); }, 60);
    },
    hit: function(){
      playNoise(0.3, 0.2);
      playTone(150, 0.3, 'sawtooth', 0.15);
    },
    powerup: function(){
      playTone(500, 0.1, 'sine', 0.1);
      setTimeout(function(){ playTone(700, 0.1, 'sine', 0.1); }, 80);
      setTimeout(function(){ playTone(1000, 0.15, 'sine', 0.1); }, 160);
    },
    gameOver: function(){
      playTone(400, 0.2, 'sawtooth', 0.12);
      setTimeout(function(){ playTone(300, 0.2, 'sawtooth', 0.12); }, 150);
      setTimeout(function(){ playTone(200, 0.4, 'sawtooth', 0.15); }, 300);
    },
    milestone: function(){
      [523,659,784,1047].forEach(function(f,i){
        setTimeout(function(){ playTone(f,0.12,'sine',0.08); }, i*80);
      });
    },
    click: function(){ playTone(600, 0.06, 'sine', 0.08); },
    duck: function(){ playNoise(0.06, 0.04); }
  };

  return { init:init, resume:resume, setMusicVol:setMusicVol, setSfxVol:setSfxVol, play:function(name){ if(sounds[name]) sounds[name](); } };
})();
