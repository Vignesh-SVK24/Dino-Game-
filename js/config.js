/* ==================== JURASSIC DINO RUN - 3D CONFIGURATION ==================== */
var JDR = window.JDR || {};

JDR.CONFIG = {
  // 2D Classic Runner config (preserved)
  CANVAS_W: 1200,
  CANVAS_H: 400,
  GROUND_Y: 340,
  GRAVITY: 0.5,
  BASE_SPEED: 2.5,
  MAX_SPEED: 8,
  SPEED_INCREMENT: 0.1,
  COIN_VALUE: 5,
  COMBO_THRESHOLD: 3,
  COMBO_MULTIPLIER: 0.5,
  POWERUP_DURATION: 300,
  OBSTACLE_MIN_GAP: 800,
  OBSTACLE_MAX_GAP: 1500,
  ENEMY_MIN_INTERVAL: 1200,
  DIFFICULTY: { easy: 0.5, normal: 1, hard: 1.4, insane: 1.8 },

  // 3D Dinosaur Riding Simulator config
  SIM_3D: {
    GRAVITY: -24.0,
    PLAYER_WALK_SPEED: 7.0,
    PLAYER_RUN_SPEED: 12.0,
    PLAYER_JUMP_IMPULSE: 10.0,
    PLAYER_HEIGHT: 1.75,
    CAMERA_FOV: 65,
    CAMERA_DEFAULT_DISTANCE: 7.5,
    CAMERA_MIN_DISTANCE: 3.5,
    CAMERA_MAX_DISTANCE: 18.0,
    CAMERA_DEFAULT_PITCH: 0.28,
    CAMERA_HEIGHT_OFFSET: 2.2,
    MAX_STAMINA: 100,
    STAMINA_DRAIN_SPRINT: 20, // per sec
    STAMINA_RECOVERY: 25, // per sec
    TERRAIN_SIZE: 300,
    TERRAIN_SEGMENTS: 90,
    INTERACTION_RADIUS: 5.5,
    MOUNT_TRANSITION_TIME: 0.7,
    ROAR_COOLDOWN: 3.5
  }
};

JDR.MAPS = [
  {
    id: 'jungle',
    name: 'Jurassic Jungle',
    description: 'Dense primeval rainforest with rushing turquoise rivers and towering cycads',
    unlocked: true,
    price: 0,
    bgImage: 'assets/jungle.png',
    skyColor: 0x5faad6,       // Rich tropical sky blue
    fogColor: 0x1f4a2a,       // Deep emerald atmospheric mist
    fogNear: 35,
    fogFar: 195,
    groundColor: 0x3d702d,   // Vibrant lush mossy jungle floor
    groundRoughness: 0.78,
    ambientColor: 0x487a52,   // Warm green foliage bounce
    sunColor: 0xfff6d9,       // Warm golden tropical sun
    sunIntensity: 1.85,
    waterColor: 0x148f9e,     // Brilliant clear turquoise river
    waterLevel: -1.2,
    particleType: 'leaves',
    particleColor: 0x76cc3b,
    treeCount: 160,
    rockCount: 75,
    biomeType: 'jungle',
    sky: ['#0b3d0b','#1a6b1a','#2d8f2d'],
    skyGrad: [['#041a04',0],['#0b3d0b',0.4],['#1a5c1a',0.7],['#3a7a3a',1]],
    groundAccent: '#1e3812',
    obstacles: ['tree_trunk','fern','rock','vine'],
    enemies: ['pterodactyl','raptor']
  },
  {
    id: 'volcano',
    name: 'Volcanic Wasteland',
    description: 'Basalt peaks, steaming fumaroles, and hazardous molten lava flows',
    unlocked: true,
    price: 0,
    bgImage: 'assets/volcano.png',
    skyColor: 0x331008,       // Dramatic fiery dark sky
    fogColor: 0x240804,       // Smoky charcoal & ember haze
    fogNear: 25,
    fogFar: 160,
    groundColor: 0x221714,   // Charcoal basalt rock with high contrast
    groundRoughness: 0.88,
    ambientColor: 0x882a14,   // Intense magma floor bounce
    sunColor: 0xff6a22,       // Blazing orange volcanic sun
    sunIntensity: 1.6,
    waterColor: 0xff4400,     // Incandescent glowing magma
    isLava: true,
    waterLevel: -0.8,
    particleType: 'ash',
    particleColor: 0xff6a22,
    treeCount: 30,
    rockCount: 140,
    biomeType: 'volcano',
    sky: ['#1a0500','#4a1500','#8a2500'],
    skyGrad: [['#0a0200',0],['#2a0800',0.3],['#5a1a00',0.6],['#8a3a10',1]],
    groundAccent: '#2a1508',
    obstacles: ['lava_rock','boulder','crack','bone'],
    enemies: ['pterodactyl','fire_bug']
  },
  {
    id: 'desert',
    name: 'Golden Desert Valley',
    description: 'Vast amber dunes, colossal fossil ribcages, and red-rock mesas',
    unlocked: false,
    price: 500,
    bgImage: 'assets/desert.png',
    skyColor: 0x62a8d8,       // Clear desert blue sky
    fogColor: 0xd4a055,       // Warm golden-hour dust haze
    fogNear: 40,
    fogFar: 220,
    groundColor: 0xdeb060,   // Rich warm golden sandstone
    groundRoughness: 0.82,
    ambientColor: 0xb58045,   // Terracotta ground bounce
    sunColor: 0xfff0c2,       // Brilliant golden-hour sunlight
    sunIntensity: 2.1,
    waterColor: 0x4aa69e,     // Desert oasis spring
    waterLevel: -3.5,
    particleType: 'sand',
    particleColor: 0xf5cf78,
    treeCount: 40,
    rockCount: 110,
    biomeType: 'desert',
    sky: ['#4a3a20','#8a7040','#c4a460'],
    skyGrad: [['#2a1a08',0],['#5a4020',0.3],['#8a6a38',0.6],['#c4a060',1]],
    groundAccent: '#9a7840',
    obstacles: ['cactus','skull','pillar','sandrock'],
    enemies: ['pterodactyl','scorpion']
  },
  {
    id: 'ice',
    name: 'Frozen Prehistoric Highlands',
    description: 'Glacial crystalline peaks, snowdrifts, and howling blizzards',
    unlocked: false,
    price: 1000,
    skyColor: 0x88c0e8,       // Crisp glacial arctic sky
    fogColor: 0x7fa9cc,       // Cool blue atmospheric snow mist
    fogNear: 30,
    fogFar: 175,
    groundColor: 0xe8f4fa,   // Bright pristine snow with blue shadows
    groundRoughness: 0.52,   // Slightly icy specular sheen
    ambientColor: 0x608fb8,   // Cool blue sky bounce
    sunColor: 0xf4f9ff,       // Bright crisp winter sun
    sunIntensity: 2.0,
    waterColor: 0x3d94cc,     // Glacial meltwater
    waterLevel: -1.5,
    particleType: 'snow',
    particleColor: 0xffffff,
    treeCount: 85,
    rockCount: 95,
    biomeType: 'ice',
    sky: ['#0a1a3a','#1a3a6a','#3a6a9a'],
    skyGrad: [['#050d1a',0],['#0a1a3a',0.3],['#1a3a6a',0.6],['#4a7aaa',1]],
    groundAccent: '#98a8b8',
    obstacles: ['ice_spike','snowball','frozen_log','ice_block'],
    enemies: ['pterodactyl','ice_bat']
  },
  {
    id: 'swamp',
    name: 'Ancient Swamp',
    description: 'Murky primeval wetlands with giant bioluminescent mushrooms and mangrove roots',
    unlocked: false,
    price: 1500,
    skyColor: 0x1f3b28,       // Deep atmospheric dusk green
    fogColor: 0x16301e,       // Murky humid swamp mist
    fogNear: 20,
    fogFar: 130,
    groundColor: 0x2a3d24,   // Dark rich peat and moss
    groundRoughness: 0.85,
    ambientColor: 0x3d7048,   // Bioluminescent green bounce
    sunColor: 0x98f2b5,       // Eerie emerald-tinted sun
    sunIntensity: 1.45,
    waterColor: 0x17382b,     // Deep reflective murky water
    waterLevel: -0.4,
    particleType: 'spores',
    particleColor: 0x55ff88,  // Glowing bioluminescent spores
    treeCount: 130,
    rockCount: 80,
    biomeType: 'swamp',
    sky: ['#0a1a0a','#1a2a10','#2a3a18'],
    skyGrad: [['#040a04',0],['#0a1a08',0.3],['#1a2a10',0.6],['#2a4a18',1]],
    groundAccent: '#1a2a10',
    obstacles: ['mushroom','vine_wall','toxic_pool','root'],
    enemies: ['pterodactyl','swamp_fly']
  }
];

JDR.DINOS = [
  {
    id: 'trex',
    name: 'Tyrannosaurus Rex',
    species: 'Tyrannosaurus rex',
    category: 'Apex Carnivore',
    price: 0,
    owned: true,
    color: '#8b7355',
    color3D: 0x8a623a,       // Warm rich earthy predator hide
    accent3D: 0x4a2e1b,      // Dark tiger-striped dorsal crests
    belly3D: 0xd9b88a,       // Warm pale cream underbelly counter-shading
    speed: 1.0,
    jump: 1.0,
    size: 1.0,
    desc: 'The apex king of dinosaurs. Massive crushing jaw, heavy ground-shaking footsteps, and unmatched charging power.',
    scale3D: 1.35,
    walkSpeed3D: 7.5,
    runSpeed3D: 14.5,
    sprintSpeed3D: 22.0,
    acceleration3D: 18.0,
    turnRate3D: 2.8,
    jumpImpulse3D: 11.0,
    staminaMax3D: 100,
    mass3D: 8000,
    mountAnchor: { x: 0, y: 3.1, z: 0.4 },
    canSwim: false,
    canFly: false,
    roarSound: 'trex',
    w: 60, h: 50,
    body: { w: 46, h: 30 }, head: { w: 24, h: 20, jaw: 14 }, tail: 35, armLen: 8,
    legLen: 18, legW: 8, skin: 'spots'
  },
  {
    id: 'spino',
    name: 'Spinosaurus',
    species: 'Spinosaurus aegyptiacus',
    category: 'Semi-Aquatic Giant',
    price: 200,
    owned: false,
    color: '#4a5d6e',
    color3D: 0x3d5466,       // Deep aquatic river teal-slate
    accent3D: 0xe84e1b,      // Brilliant crimson-orange dorsal sail with highlights
    belly3D: 0x9cb8c9,       // Pale aquatic belly
    speed: 1.1,
    jump: 0.9,
    size: 1.1,
    desc: 'The largest predatory dinosaur in history. Features a grand dorsal sail and specialized aquatic swimming ability.',
    scale3D: 1.45,
    walkSpeed3D: 7.2,
    runSpeed3D: 14.0,
    sprintSpeed3D: 21.0,
    acceleration3D: 16.0,
    turnRate3D: 2.5,
    jumpImpulse3D: 9.5,
    staminaMax3D: 110,
    mass3D: 9000,
    mountAnchor: { x: 0, y: 3.3, z: 0.9 },
    canSwim: true,
    canFly: false,
    roarSound: 'spino',
    sail: true,
    w: 68, h: 58,
    body: { w: 50, h: 28 }, head: { w: 28, h: 16, jaw: 16 }, tail: 38, armLen: 12,
    legLen: 20, legW: 7, skin: 'stripes'
  },
  {
    id: 'stego',
    name: 'Stegosaurus',
    species: 'Stegosaurus stenops',
    category: 'Armored Herbivore',
    price: 300,
    owned: false,
    color: '#5a7a3a',
    color3D: 0x4a7536,       // Rich forest jade green
    accent3D: 0xe57218,      // Fiery amber-orange dorsal plates with golden trim
    belly3D: 0xa9c488,       // Soft pale moss belly
    speed: 0.85,
    jump: 0.85,
    size: 1.15,
    desc: 'Heavily armored with dual rows of vibrant defensive plates and a devastating four-spiked thagomizer tail.',
    scale3D: 1.25,
    walkSpeed3D: 6.2,
    runSpeed3D: 11.5,
    sprintSpeed3D: 17.5,
    acceleration3D: 14.0,
    turnRate3D: 2.2,
    jumpImpulse3D: 8.5,
    staminaMax3D: 125,
    mass3D: 5000,
    mountAnchor: { x: 0, y: 2.6, z: 0.2 },
    canSwim: false,
    canFly: false,
    roarSound: 'stego',
    plates: true, quad: true,
    w: 65, h: 50,
    body: { w: 52, h: 32 }, head: { w: 18, h: 14, jaw: 8 }, tail: 30, armLen: 6,
    legLen: 16, legW: 8, skin: 'scales'
  },
  {
    id: 'diplo',
    name: 'Diplodocus',
    species: 'Diplodocus carnegii',
    category: 'Colossal Sauropod',
    price: 400,
    owned: false,
    color: '#5c7a8a',
    color3D: 0x58788a,       // Majestic ocean-slate blue hide
    accent3D: 0x344b57,      // Deep slate spine ridges
    belly3D: 0x9ec0d1,       // Pale sky belly
    speed: 0.9,
    jump: 1.15,
    size: 1.25,
    desc: 'Colossal long-necked gentle giant with an elevated vantage point rider position and immense sweeping strides.',
    scale3D: 1.7,
    walkSpeed3D: 6.8,
    runSpeed3D: 12.0,
    sprintSpeed3D: 18.0,
    acceleration3D: 12.0,
    turnRate3D: 1.8,
    jumpImpulse3D: 8.0,
    staminaMax3D: 150,
    mass3D: 15000,
    mountAnchor: { x: 0, y: 4.8, z: 0.5 },
    canSwim: false,
    canFly: false,
    roarSound: 'diplo',
    longNeck: true, quad: true,
    w: 75, h: 55,
    body: { w: 48, h: 26 }, head: { w: 16, h: 12, jaw: 6 }, tail: 45, armLen: 5,
    legLen: 22, legW: 8, skin: 'smooth'
  },
  {
    id: 'coelo',
    name: 'Coelophysis',
    species: 'Coelophysis bauri',
    category: 'Swift Scout',
    price: 150,
    owned: false,
    color: '#7a8a3a',
    color3D: 0x829636,       // Swift golden-chartreuse hide
    accent3D: 0x4a591e,      // Dark cheetah dapples
    belly3D: 0xcfe08b,       // Pale sun belly
    speed: 1.25,
    jump: 1.1,
    size: 0.75,
    desc: 'Slender, lightweight, and incredibly fast. Unbeatable cornering speed and rapid acceleration.',
    scale3D: 0.9,
    walkSpeed3D: 8.5,
    runSpeed3D: 16.5,
    sprintSpeed3D: 25.0,
    acceleration3D: 26.0,
    turnRate3D: 4.2,
    jumpImpulse3D: 13.0,
    staminaMax3D: 90,
    mass3D: 60,
    mountAnchor: { x: 0, y: 1.6, z: 0.1 },
    canSwim: false,
    canFly: false,
    roarSound: 'coelo',
    w: 48, h: 40,
    body: { w: 34, h: 18 }, head: { w: 16, h: 10, jaw: 8 }, tail: 28, armLen: 8,
    legLen: 18, legW: 5, skin: 'spots'
  },
  {
    id: 'raptor',
    name: 'Velociraptor',
    species: 'Velociraptor mongoliensis',
    category: 'Agile Hunter',
    price: 350,
    owned: false,
    color: '#5a6a7a',
    color3D: 0x526778,       // Steel predator slate
    accent3D: 0xd47326,      // Fiery amber feather crest tips
    belly3D: 0xb2c7d9,       // Soft pale underbelly
    speed: 1.3,
    jump: 1.2,
    size: 0.85,
    desc: 'Lethal intelligence with feathered crests and powerful sickle claws. Capable of soaring leaps and quick turns.',
    scale3D: 1.05,
    walkSpeed3D: 8.2,
    runSpeed3D: 16.0,
    sprintSpeed3D: 24.5,
    acceleration3D: 24.0,
    turnRate3D: 3.8,
    jumpImpulse3D: 14.5,
    staminaMax3D: 95,
    mass3D: 80,
    mountAnchor: { x: 0, y: 1.9, z: 0.15 },
    canSwim: false,
    canFly: false,
    roarSound: 'raptor',
    feathers: true,
    w: 55, h: 45,
    body: { w: 38, h: 22 }, head: { w: 18, h: 12, jaw: 10 }, tail: 32, armLen: 10,
    legLen: 20, legW: 5, skin: 'markings'
  },
  {
    id: 'ankylo',
    name: 'Ankylosaurus',
    species: 'Ankylosaurus magniventris',
    category: 'Living Fortress',
    price: 500,
    owned: false,
    color: '#6a5a4a',
    color3D: 0x66523d,       // Weathered heavy bronze-earth hide
    accent3D: 0x36271c,      // Dark bone-studded osteoderm shields
    belly3D: 0xa89378,       // Tough leathery belly
    speed: 0.75,
    jump: 0.7,
    size: 1.3,
    desc: 'Impervious walking tank with thick bony osteoderm armor and a devastating bone-crushing tail club.',
    scale3D: 1.3,
    walkSpeed3D: 5.8,
    runSpeed3D: 10.5,
    sprintSpeed3D: 16.0,
    acceleration3D: 13.0,
    turnRate3D: 2.0,
    jumpImpulse3D: 7.5,
    staminaMax3D: 140,
    mass3D: 7000,
    mountAnchor: { x: 0, y: 2.2, z: 0.1 },
    canSwim: false,
    canFly: false,
    roarSound: 'ankylo',
    clubTail: true, armor: true, quad: true,
    w: 70, h: 48,
    body: { w: 54, h: 34 }, head: { w: 20, h: 18, jaw: 10 }, tail: 28, armLen: 5,
    legLen: 14, legW: 10, skin: 'bumpy'
  },
  {
    id: 'trice',
    name: 'Triceratops',
    species: 'Triceratops horridus',
    category: 'Horned Charger',
    price: 450,
    owned: false,
    color: '#7a6a4a',
    color3D: 0x786445,       // Warm ochre ceratopsian hide
    accent3D: 0xa84a22,      // Terracotta sun-patterned frill rim
    belly3D: 0xbdb094,       // Soft sandy belly
    speed: 0.9,
    jump: 0.8,
    size: 1.15,
    desc: 'Three formidable facial horns and a solid bone shield frill. Powerful frontal defensive charge momentum.',
    scale3D: 1.25,
    walkSpeed3D: 6.8,
    runSpeed3D: 13.0,
    sprintSpeed3D: 19.5,
    acceleration3D: 17.0,
    turnRate3D: 2.4,
    jumpImpulse3D: 9.0,
    staminaMax3D: 120,
    mass3D: 6500,
    mountAnchor: { x: 0, y: 2.5, z: 0.2 },
    canSwim: false,
    canFly: false,
    roarSound: 'trice',
    horns: true, frill: true, quad: true,
    w: 68, h: 50,
    body: { w: 48, h: 32 }, head: { w: 22, h: 20, jaw: 12 }, tail: 24, armLen: 6,
    legLen: 16, legW: 9, skin: 'leathery'
  },
  {
    id: 'pteranodon',
    name: 'Pteranodon',
    species: 'Pteranodon longiceps',
    category: 'Aerial Soarer',
    price: 600,
    owned: false,
    color: '#8a624a',
    color3D: 0x8a573b,       // Warm canyon terracotta body
    accent3D: 0xd9381e,      // Blazing scarlet-orange cranial crest
    belly3D: 0xedd0b9,       // Pale flight belly
    speed: 1.35,
    jump: 1.4,
    size: 1.05,
    desc: 'Majestic prehistoric flying reptile with aerodynamic wings and backward skull crest. Capable of aerial soaring flight!',
    scale3D: 1.2,
    walkSpeed3D: 6.5,
    runSpeed3D: 12.0,
    sprintSpeed3D: 26.0,
    acceleration3D: 20.0,
    turnRate3D: 3.5,
    jumpImpulse3D: 16.0,
    staminaMax3D: 110,
    mass3D: 45,
    mountAnchor: { x: 0, y: 1.8, z: -0.1 },
    canSwim: false,
    canFly: true,
    roarSound: 'ptera',
    wings: true,
    w: 60, h: 44,
    body: { w: 40, h: 20 }, head: { w: 22, h: 14, jaw: 12 }, tail: 18, armLen: 14,
    legLen: 16, legW: 5, skin: 'leathery'
  }
];

JDR.POWERUPS = [
  { id: 'shield', name: 'Shield', icon: '🛡️', color: '#4ecdc4', duration: 300 },
  { id: 'magnet', name: 'Amber Magnet', icon: '🧲', color: '#f5a623', duration: 400 },
  { id: 'slow', name: 'Slow Motion', icon: '⏳', color: '#aa88ff', duration: 250 },
  { id: 'speed', name: 'Speed Boost', icon: '⚡', color: '#ffaa00', duration: 200 },
  { id: 'double', name: 'Double Score', icon: '✨', color: '#ff6b6b', duration: 350 },
  { id: 'life', name: 'Extra Life', icon: '❤️', color: '#ff4466', duration: 0 }
];

JDR.DEFAULT_SAVE = {
  version: 2,
  coins: 250,
  ownedDinos: ['trex'],
  selectedDino: 'trex',
  selectedMap: 'jungle',
  unlockedMaps: ['jungle','volcano'],
  highScores: [],
  achievements: [],
  explorationStats: {
    amberCollected: 0,
    distanceRiddenKm: 0,
    dinosMounted: 0,
    timeTrialsCompleted: 0
  },
  settings: {
    musicVol: 70, sfxVol: 85, difficulty: 'normal',
    showFps: false, screenShake: true, particles: 'high',
    cameraDistance: 7.5, mouseSensitivity: 1.0, graphicsQuality: 'high'
  },
  totalGames: 0, totalCoins: 0
};
