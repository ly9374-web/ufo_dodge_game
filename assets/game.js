(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const homeScreen = document.getElementById("homeScreen");
  const gameHud = document.getElementById("gameHud");
  const heartsText = document.getElementById("heartsText");
  const statusText = document.getElementById("statusText");
  const recordDeltaText = document.getElementById("recordDeltaText");
  const startButton = document.getElementById("startButton");
  const extremeButton = document.getElementById("extremeButton");
  const flashScreen = document.getElementById("flashScreen");
  const staminaHud = document.getElementById("staminaHud");
  const staminaFill = document.getElementById("staminaFill");
  const clearEntryButton = document.getElementById("clearEntryButton");
  const leaderboardButton = document.getElementById("leaderboardButton");
  const leaderboardModal = document.getElementById("leaderboardModal");
  const leaderboardTitle = document.getElementById("leaderboardTitle");
  const closeLeaderboardButton = document.getElementById("closeLeaderboardButton");
  const leaderboardList = document.getElementById("leaderboardList");
  const clearModal = document.getElementById("clearModal");
  const closeClearButton = document.getElementById("closeClearButton");
  const clearPasswordInput = document.getElementById("clearPasswordInput");
  const confirmClearButton = document.getElementById("confirmClearButton");
  const clearForm = document.getElementById("clearForm");
  const clearMessage = document.getElementById("clearMessage");
  const clearModalTitle = document.getElementById("clearModalTitle");
  const difficultyButton = document.getElementById("difficultyButton");
  const difficultyPanel = document.getElementById("difficultyPanel");
  const difficultyLevelText = document.getElementById("difficultyLevelText");
  const difficultySlider = document.getElementById("difficultySlider");
  const difficultyTicks = Array.from(document.querySelectorAll(".difficulty-tick"));
  const chillDifficultyButton = document.getElementById("chillDifficultyButton");
  const tutorialModal = document.getElementById("tutorialModal");
  const tutorialMessage = document.getElementById("tutorialMessage");
  const orientationModal = document.getElementById("orientationModal");

  const assets = {
    player: loadImage("assets/player.png"),
    player2: loadImage("assets/player2.png")
  };

  const constants = {
    leaderboardStorageKey: "leaderboard.v1.web",
    maxCanvasDpr: 1.25,
    uiSyncInterval: 0.1,
    mobileSizeScale: 0.72,
    basePlayerRadius: 10,
    basePlayerDrawSize: 50,
    // 手动调参：飞碟速度。数字越大飞碟越快，越小飞碟越慢。
    playerSpeed: 280,
    // 手动调参：极难模式速度倍率。0.93 表示普通模式速度的 93%。
    extremeSpeedMultiplier: 0.95,
    baseEnemyRadius: 12,
    baseShieldRadius: 22,
    baseRayBeamLength: 140,
    baseRayBeamThickness: 6,
    baseRayTelegraphWidth: 1.5,
    baseShieldLineWidth: 1.5,
    baseParticleMinSize: 2,
    baseParticleMaxSize: 4,
    baseEnemyExpireParticleMinSize: 1.5,
    baseEnemyExpireParticleMaxSize: 3,
    // 手动调参：陨石速度。数字越大陨石越快，越小陨石越慢。
    enemySpeed: 235,
    enemyLifeDuration: 15,
    // 手动调参：普通模式按住加速时的飞碟速度。
    playerBoostSpeed: 420,
    staminaMax: 0.5,
    staminaRecoveryDuration: 5,
    // 手动调参：困难普通模式陨石生成间隔。数字越大陨石越少，越小陨石越密。
    hardEnemyMinInterval: 0.65,
    hardEnemyMaxInterval: 0.85,
    // 手动调参：困难极难模式陨石生成间隔。数字越大陨石越少，越小陨石越密。
    hardExtremeEnemyMinInterval: 1.5,
    hardExtremeEnemyMaxInterval: 1.65,
    // 手动调参：难度档位。5 档等于旧普通，10 档等于旧困难；difficultyStep 越大档位差距越大。
    defaultDifficultyLevel: 5,
    minDifficultyLevel: 1,
    maxDifficultyLevel: 12,
    hardReferenceDifficultyLevel: 10,
    difficultyStep: 0.1,
    // 手动调参：悠闲模式陨石生成间隔。数字越大陨石越少，越小陨石越密。
    chillEnemyInterval: 0.8,
    chillExtremeEnemyInterval: 1.6,
    // 手动调参：开局陨石数量。数字越大开局陨石越多，越小越少。
    initialEnemyCount: 5,
    maxParticles: 220,
    enemyTrailParticleChance: 0.45,
    enemyExpireParticleCount: 28,
    hardNormalRayInterval: 2.5,
    hardExtremeRayInterval: 3.5,
    joystickMaxDistance: 54,
    clearPassword: "Z5027483"
  };

  function scaledSize(value) {
    return value * constants.mobileSizeScale;
  }

  function playerRadius() {
    return scaledSize(constants.basePlayerRadius);
  }

  function playerDrawSize() {
    return scaledSize(constants.basePlayerDrawSize);
  }

  function enemyRadius() {
    return scaledSize(constants.baseEnemyRadius);
  }

  function shieldRadius() {
    return scaledSize(constants.baseShieldRadius);
  }

  function rayBeamLength() {
    return scaledSize(constants.baseRayBeamLength);
  }

  function rayBeamThickness() {
    return scaledSize(constants.baseRayBeamThickness);
  }

  function rayTelegraphWidth() {
    return Math.max(1, scaledSize(constants.baseRayTelegraphWidth));
  }

  function shieldLineWidth() {
    return Math.max(1, scaledSize(constants.baseShieldLineWidth));
  }

  const legacyDifficultyLevels = {
    hard: { level: 10, chill: false },
    normal: { level: 5, chill: false },
    chill: { level: 5, chill: true }
  };

  const gameModeLabels = {
    normal: "普通模式",
    extreme: "极难模式"
  };

  const gameModeOrder = ["normal", "extreme"];

  function clampDifficultyLevel(level) {
    return clamp(
      Math.round(Number(level) || constants.defaultDifficultyLevel),
      constants.minDifficultyLevel,
      constants.maxDifficultyLevel
    );
  }

  function difficultyMultiplier() {
    const referenceLevel = isChillDifficulty ? 8 : constants.hardReferenceDifficultyLevel;
    return Math.max(
      0.1,
      1 + (referenceLevel - difficultyLevel) * constants.difficultyStep
    );
  }

  function currentDifficultyKey() {
    return `${isChillDifficulty ? "chill" : "standard"}-${difficultyLevel}`;
  }

  function difficultyLabelFromParts(level = difficultyLevel, chill = isChillDifficulty) {
    return `${chill ? "悠闲" : "难度"} ${level}档`;
  }

  function difficultyLabelFromKey(key) {
    const parsed = parseDifficultyKey(key);
    return difficultyLabelFromParts(parsed.level, parsed.chill);
  }

  function parseDifficultyKey(key) {
    if (legacyDifficultyLevels[key]) return legacyDifficultyLevels[key];

    const match = /^(standard|chill)-(\d+)$/.exec(String(key || ""));
    if (!match) {
      return { level: constants.defaultDifficultyLevel, chill: false };
    }

    return {
      level: clampDifficultyLevel(match[2]),
      chill: match[1] === "chill"
    };
  }

  function difficultyKeys() {
    const keys = [];
    for (const chill of [false, true]) {
      for (let level = constants.minDifficultyLevel; level <= constants.maxDifficultyLevel; level += 1) {
        keys.push(`${chill ? "chill" : "standard"}-${level}`);
      }
    }
    return keys;
  }

  const pressedKeys = new Set();
  const boostPointers = new Set();
  function makeJoystickState() {
    return {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      directionX: 0,
      directionY: 0
    };
  }

  const touchControls = {
    primary: makeJoystickState(),
    secondary: makeJoystickState()
  };
  const player = {
    x: 0,
    y: 0,
    directionX: 0,
    directionY: 0
  };
  const playerTwo = {
    x: 0,
    y: 0,
    directionX: 0,
    directionY: 0
  };

  let gameState = "home";
  let gameMode = "normal";
  let stars = [];
  let enemies = [];
  let particles = [];
  let activeRays = [];
  let lastFrameTime = 0;
  let uiSyncAccumulator = 0;
  let elapsedTime = 0;
  let nextSpawnTime = 0;
  let nextRayTime = 10;
  let lives = 3;
  let stamina = constants.staminaMax;
  let playerOneShielded = false;
  let playerTwoShielded = false;
  let flashRemaining = 0;
  let returnHomeRemaining = 0;
  let hasPlayedOnce = false;
  let didPlacePlayer = false;
  let didSpawnInitialEnemies = false;
  let difficultyLevel = constants.defaultDifficultyLevel;
  let isChillDifficulty = false;
  let leaderboard = loadLeaderboard();
  let editingEntryId = "";
  let hasRecordedThisGame = false;
  let pendingTutorialMode = "";
  let pendingLandscapeStartMode = "";
  let tutorialProgress = null;

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    return image;
  }

  function viewportFromWindow(sourceWindow) {
    if (!sourceWindow) return null;

    const sourceDocument = sourceWindow.document;
    const documentElement = sourceDocument && sourceDocument.documentElement;
    const candidates = [
      sourceWindow.visualViewport && {
        width: sourceWindow.visualViewport.width,
        height: sourceWindow.visualViewport.height
      },
      documentElement && {
        width: documentElement.clientWidth,
        height: documentElement.clientHeight
      },
      {
        width: sourceWindow.innerWidth,
        height: sourceWindow.innerHeight
      }
    ];

    return candidates.find((size) => size && size.width > 0 && size.height > 0) || null;
  }

  function parentViewportSize() {
    try {
      if (window.parent && window.parent !== window) {
        return viewportFromWindow(window.parent);
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function getViewportSize() {
    const parentSize = parentViewportSize();
    const localSize = viewportFromWindow(window);
    const size = parentSize || localSize || { width: 320, height: 320 };

    return {
      width: Math.max(320, Math.round(size.width)),
      height: Math.max(320, Math.round(size.height))
    };
  }

  function isLandscapeViewport() {
    const orientation = window.screen && window.screen.orientation;
    if (orientation && typeof orientation.angle === "number" && Math.abs(orientation.angle) % 180 === 90) {
      return true;
    }

    const { width, height } = getViewportSize();
    return width >= height;
  }

  function syncGameViewportStyle(width, height) {
    document.documentElement.style.setProperty("--game-width", `${width}px`);
    document.documentElement.style.setProperty("--game-height", `${height}px`);
  }

  function resizeCanvas() {
    const dpr = Math.min(constants.maxCanvasDpr, Math.max(1, window.devicePixelRatio || 1));
    const { width, height } = getViewportSize();
    syncGameViewportStyle(width, height);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!didPlacePlayer) {
      resetPlayerPositions(width, height);
      didPlacePlayer = true;
    } else {
      constrainPlayerToGameArea(player);
      constrainPlayerToGameArea(playerTwo);
    }

    makeStars(width, height);
  }

  function resetPlayerPositions(width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const extremeStartGap = Math.max(playerRadius() * 6, Math.min(width * 0.18, 160));

    player.x = gameMode === "extreme" ? centerX - extremeStartGap : centerX;
    player.y = centerY;
    player.directionX = 0;
    player.directionY = 0;
    playerTwo.x = gameMode === "extreme" ? centerX + extremeStartGap : centerX + playerRadius() * 3;
    playerTwo.y = centerY;
    playerTwo.directionX = 0;
    playerTwo.directionY = 0;
  }

  function makeStars(width, height) {
    const count = Math.max(40, Math.floor((width * height) / 12000));
    stars = Array.from({ length: count }, () => ({
      x: random(0, width),
      y: random(0, height),
      radius: random(0.6, 1.6),
      baseOpacity: random(0.2, 0.6),
      twinkleSpeed: random(0.6, 1.4),
      phase: random(0, Math.PI * 2)
    }));
  }

  function startGame(mode, options = {}) {
    const preservePlayerPositions = Boolean(options.preservePlayerPositions);
    const preserveTouchControls = Boolean(options.preserveTouchControls);
    const { width, height } = getViewportSize();

    closeLeaderboard();
    closeClearModal();
    hideTutorial();
    hideOrientationPrompt();
    difficultyPanel.classList.add("is-hidden");
    gameMode = mode;
    gameState = "playing";
    lives = gameMode === "normal" ? 3 : 6;
    elapsedTime = 0;
    nextSpawnTime = nextSpawnInterval(0);
    nextRayTime = isChillDifficulty ? 5 : 10;
    flashRemaining = 0;
    returnHomeRemaining = 0;
    stamina = constants.staminaMax;
    playerOneShielded = false;
    playerTwoShielded = false;
    hasRecordedThisGame = false;
    enemies = [];
    activeRays = [];
    particles = [];
    if (!preserveTouchControls) {
      pressedKeys.clear();
      resetTouchControls();
    }
    didSpawnInitialEnemies = false;
    if (!preservePlayerPositions) {
      resetPlayerPositions(width, height);
    }
    constrainPlayerToGameArea(player);
    constrainPlayerToGameArea(playerTwo);
    ensureInitialEnemies(width, height);
    syncUi();
  }

  function returnHome() {
    gameState = "home";
    enemies = [];
    activeRays = [];
    particles = [];
    pressedKeys.clear();
    resetTouchControls();
    flashRemaining = 0;
    returnHomeRemaining = 0;
    pendingTutorialMode = "";
    tutorialProgress = null;
    pendingLandscapeStartMode = "";
    hideTutorial();
    hideOrientationPrompt();
    startButton.textContent = hasPlayedOnce ? "再来一局" : "开始";
    syncUi();
  }

  function syncUi() {
    uiSyncAccumulator = 0;
    const isPlayingView = gameState === "playing" || gameState === "tutorial" || gameState === "gameOver";
    homeScreen.classList.toggle("is-hidden", isPlayingView);
    gameHud.classList.toggle("is-hidden", gameState === "home" || gameState === "tutorial");
    clearEntryButton.classList.toggle("is-hidden", isPlayingView);
    difficultyButton.classList.toggle("is-hidden", gameState !== "home");
    if (gameState !== "home") {
      difficultyPanel.classList.add("is-hidden");
    }
    heartsText.textContent = "❤️".repeat(Math.max(0, lives));
    statusText.textContent = `存活 ${elapsedTime.toFixed(1)}s`;
    staminaHud.classList.toggle("is-hidden", !(gameState === "playing" && gameMode === "normal"));
    staminaFill.style.width = `${clamp(stamina / constants.staminaMax, 0, 1) * 100}%`;
    updateRecordDelta();
    syncDifficultyOptions();
  }

  function syncUiIfNeeded(dt) {
    uiSyncAccumulator += dt;
    if (uiSyncAccumulator < constants.uiSyncInterval) return;
    syncUi();
  }

  function onKeyDown(event) {
    if (isTextInput(event.target)) return;
    const key = normalizedKey(event);
    if (!key) return;
    pressedKeys.add(key);
    event.preventDefault();
  }

  function onKeyUp(event) {
    if (isTextInput(event.target)) return;
    const key = normalizedKey(event);
    if (!key) return;
    pressedKeys.delete(key);
    event.preventDefault();
  }

  function normalizedKey(event) {
    const key = event.key.toLowerCase();
    if (
      key === "w" ||
      key === "a" ||
      key === "s" ||
      key === "d" ||
      key === "i" ||
      key === "j" ||
      key === "k" ||
      key === "l" ||
      key === " "
    ) {
      return key;
    }
    return "";
  }

  function isTextInput(target) {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  }

  function frame(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const dt = Math.min((timestamp - lastFrameTime) / 1000, 1 / 20);
    lastFrameTime = timestamp;

    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function update(dt) {
    updateStars(dt);
    updateParticles(dt);

    if (flashRemaining > 0) {
      flashRemaining = Math.max(0, flashRemaining - dt);
    }

    if (gameState === "home") {
      return;
    }

    if (gameState === "tutorial") {
      updatePlayers(dt);
      updateTutorialProgress();
      return;
    }

    if (gameState === "gameOver") {
      updateEnemies(dt);
      updateRays(dt);
      returnHomeRemaining -= dt;
      if (returnHomeRemaining <= 0) {
        returnHome();
      }
      syncUiIfNeeded(dt);
      return;
    }

    elapsedTime += dt;
    updatePlayers(dt);
    updateEnemies(dt);
    spawnEnemiesIfNeeded();
    updateRays(dt);
    handleCollisions();
    syncUiIfNeeded(dt);
  }

  function updateRecordDelta() {
    const best = topLeaderboardDuration(gameMode, currentDifficultyKey());
    const shouldShow = (gameState === "playing" || gameState === "gameOver") && Number.isFinite(best);
    recordDeltaText.classList.toggle("is-hidden", !shouldShow);
    if (!shouldShow) return;

    const remaining = best - elapsedTime;
    const displaySeconds = Math.abs(remaining);
    const isAhead = remaining <= 0;
    recordDeltaText.textContent = isAhead
      ? `超越 ${displaySeconds.toFixed(1)}s`
      : `还差 ${displaySeconds.toFixed(1)}s`;
    recordDeltaText.classList.toggle("is-ahead", isAhead);
  }

  function updatePlayers(dt) {
    const primaryDirection = movementDirection("primary");
    const hasPrimaryInput = primaryDirection.x !== 0 || primaryDirection.y !== 0;
    const wantsBoost = gameMode === "normal" && (pressedKeys.has(" ") || boostPointers.size > 0) && hasPrimaryInput;
    let isBoosting = wantsBoost && stamina > 0;
    updateStamina(dt, isBoosting);
    if (stamina <= 0) {
      isBoosting = false;
    }

    updatePlayerPosition(
      player,
      primaryDirection,
      isBoosting ? constants.playerBoostSpeed : playerSpeedForMode(),
      "rgba(255, 255, 255, 0.9)",
      dt
    );

    if (!isDualMode()) return;

    updatePlayerPosition(
      playerTwo,
      movementDirection("secondary"),
      playerSpeedForMode(),
      "rgba(0, 255, 255, 0.9)",
      dt
    );
  }

  function speedMultiplierForMode() {
    return gameMode === "extreme" ? constants.extremeSpeedMultiplier : 1;
  }

  function playerSpeedForMode() {
    return constants.playerSpeed * speedMultiplierForMode();
  }

  function enemySpeedForMode() {
    return constants.enemySpeed * speedMultiplierForMode();
  }

  function updateStamina(dt, isBoosting) {
    if (gameMode !== "normal") {
      stamina = constants.staminaMax;
      return;
    }

    if (isBoosting) {
      stamina = Math.max(0, stamina - dt);
    } else {
      const recoveryRate = constants.staminaMax / constants.staminaRecoveryDuration;
      stamina = Math.min(constants.staminaMax, stamina + dt * recoveryRate);
    }
  }

  function updatePlayerPosition(target, direction, speed, color, dt) {
    if (direction.x === 0 && direction.y === 0) {
      target.directionX = 0;
      target.directionY = 0;
      return;
    }

    target.x += direction.x * speed * dt;
    target.y += direction.y * speed * dt;
    constrainPlayerToGameArea(target);
    target.directionX = direction.x;
    target.directionY = direction.y;
    emitParticles(target.x, target.y, color, 2);
  }

  function movementDirection(input) {
    let dx = 0;
    let dy = 0;

    if (input === "primary") {
      if (pressedKeys.has("a")) dx -= 1;
      if (pressedKeys.has("d")) dx += 1;
      if (pressedKeys.has("w")) dy -= 1;
      if (pressedKeys.has("s")) dy += 1;
      dx += touchControls.primary.directionX;
      dy += touchControls.primary.directionY;
    } else {
      if (pressedKeys.has("j")) dx -= 1;
      if (pressedKeys.has("l")) dx += 1;
      if (pressedKeys.has("i")) dy -= 1;
      if (pressedKeys.has("k")) dy += 1;
      dx += touchControls.secondary.directionX;
      dy += touchControls.secondary.directionY;
    }

    const length = Math.hypot(dx, dy);
    if (length > 0) {
      dx /= length;
      dy /= length;
    }

    return { x: dx, y: dy };
  }

  function constrainPlayerToGameArea(target) {
    const radius = playerRadius();
    const { width, height } = getViewportSize();
    target.x = clamp(target.x, radius, width - radius);
    target.y = clamp(target.y, radius, height - radius);
  }

  function joystickAreas() {
    if (gameState !== "playing" && gameState !== "tutorial") return [];
    const { width, height } = getViewportSize();
    const controlWidth = width / 2;
    const controlHeight = 1.2 * controlWidth;
    const controlY = height - controlHeight;

    if (gameMode === "normal") {
      return [
        {
          id: "primary",
          x: width - controlWidth,
          y: controlY,
          width: controlWidth,
          height: controlHeight
        }
      ];
    }

    if (gameMode === "extreme") {
      const extremeControlWidth = width / 5;
      const extremeControlHeight = 1.2 * extremeControlWidth;
      const extremeControlY = height - extremeControlHeight;
      return [
        {
          id: "primary",
          x: 0,
          y: extremeControlY,
          width: extremeControlWidth,
          height: extremeControlHeight
        },
        {
          id: "secondary",
          x: width - extremeControlWidth,
          y: extremeControlY,
          width: extremeControlWidth,
          height: extremeControlHeight
        }
      ];
    }

    return [];
  }

  function updateStars(dt) {
    for (const star of stars) {
      star.phase += dt * star.twinkleSpeed;
    }
  }

  function updateEnemies(dt) {
    const turnLimit = 0.02 * (dt * 60);
    const { width, height } = getViewportSize();
    enemies = enemies.filter((enemy) => {
      enemy.lifeRemaining -= dt;
      if (enemy.lifeRemaining <= 0) {
        emitEnemyExpireParticles(enemy.x, enemy.y, enemy.color);
        return false;
      }

      const target = targetPlayer(enemy.x, enemy.y);
      const targetAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      const deltaAngle = normalizeAngle(targetAngle - enemy.angle);
      enemy.angle += clamp(deltaAngle, -turnLimit, turnLimit);
      const enemySpeed = enemySpeedForMode();
      enemy.x += Math.cos(enemy.angle) * enemySpeed * dt;
      enemy.y += Math.sin(enemy.angle) * enemySpeed * dt;

      if (Math.random() < constants.enemyTrailParticleChance) {
        emitParticles(enemy.x, enemy.y, enemy.color, 1);
      }

      return (
        enemy.x >= -50 &&
        enemy.y >= -50 &&
        enemy.x <= width + 50 &&
        enemy.y <= height + 50
      );
    });
  }

  function updateParticles(dt) {
    particles = particles.filter((particle) => {
      particle.life -= dt;
      if (particle.life <= 0) return false;

      if (particle.delay > 0) {
        particle.delay -= dt;
        if (particle.delay <= 0) {
          particle.vx = particle.burstVx;
          particle.vy = particle.burstVy;
        }
        return true;
      }

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.opacity = Math.max(0, particle.opacity - dt * 2.4);
      return true;
    });
  }

  function ensureInitialEnemies(width, height) {
    if (didSpawnInitialEnemies || gameState !== "playing" || width <= 0 || height <= 0) return;
    enemies = Array.from({ length: constants.initialEnemyCount }, () => makeEnemy(width, height));
    didSpawnInitialEnemies = true;
  }

  function spawnEnemiesIfNeeded() {
    if (elapsedTime < nextSpawnTime) return;
    const { width, height } = getViewportSize();
    enemies.push(makeEnemy(width, height));
    nextSpawnTime = elapsedTime + nextSpawnInterval(elapsedTime);
  }

  function nextSpawnInterval(time) {
    const multiplier = difficultyMultiplier();
    if (isChillDifficulty) {
      const interval = gameMode === "extreme" ? constants.chillExtremeEnemyInterval : constants.chillEnemyInterval;
      return interval * multiplier;
    }

    const isExtreme = gameMode === "extreme";
    const steps = Math.floor(time / (isExtreme ? 4 : 3));
    const minInterval = isExtreme
      ? Math.max(0.9, constants.hardExtremeEnemyMinInterval - 0.5 * steps)
      : Math.max(0.03, constants.hardEnemyMinInterval - 0.03 * steps);
    const maxInterval = isExtreme
      ? Math.max(minInterval + 0.15, constants.hardExtremeEnemyMaxInterval - 0.5 * steps)
      : Math.max(minInterval + 0.1, constants.hardEnemyMaxInterval - 0.03 * steps);
    return random(minInterval * multiplier, maxInterval * multiplier);
  }

  function makeEnemy(width, height) {
    const edge = Math.floor(random(0, 4));
    let x;
    let y;

    if (edge === 0) {
      x = random(0, width);
      y = -20;
    } else if (edge === 1) {
      x = width + 20;
      y = random(0, height);
    } else if (edge === 2) {
      x = random(0, width);
      y = height + 20;
    } else {
      x = -20;
      y = random(0, height);
    }

    const target = targetPlayer(x, y);
    return {
      x,
      y,
      angle: Math.atan2(target.y - y, target.x - x),
      color: `hsl(${Math.floor(random(0, 360))} 90% 55%)`,
      craters: makeCraters(),
      lifeRemaining: constants.enemyLifeDuration
    };
  }

  function makeCraters() {
    const count = Math.floor(random(3, 6));
    return Array.from({ length: count }, () => ({
      x: random(-0.6, 0.6),
      y: random(-0.6, 0.6),
      radius: random(0.12, 0.26),
      depth: random(0.1, 0.25)
    }));
  }

  function updateRays(dt) {
    const beamDuration = 0.35;
    const rayStartTime = isChillDifficulty ? 5 : 10;

    activeRays = activeRays.filter((ray) => {
      if (ray.phase === "telegraph") {
        ray.phaseRemaining -= dt;
        if (ray.phaseRemaining <= 0) {
          ray.phase = "firing";
          ray.phaseRemaining = beamDuration;
          ray.progress = 0;
          ray.hasDealtDamage = false;
        }
        return true;
      }

      ray.phaseRemaining -= dt;
      ray.progress = Math.min(1, ray.progress + dt / beamDuration);
      if (!ray.hasDealtDamage) {
        const hitTarget = playerHitByBeam(ray, rayBeamLength(), rayBeamThickness());
        if (hitTarget) {
          applyDamage(hitTarget, NaN, NaN, "rgba(255, 0, 0, 1)");
          ray.hasDealtDamage = true;
        }
      }
      return ray.phaseRemaining > 0;
    });

    if (
      gameState === "playing" &&
      elapsedTime >= nextRayTime &&
      elapsedTime >= rayStartTime &&
      getViewportSize().width > 0 &&
      getViewportSize().height > 0
    ) {
      const { width, height } = getViewportSize();
      const rayCount = isChillDifficulty ? 2 : Math.min(3, Math.max(1, Math.floor(elapsedTime / 10)));
      for (let index = 0; index < rayCount; index += 1) {
        activeRays.push(makeRay(width, height));
      }
      nextRayTime = elapsedTime + nextRayInterval(elapsedTime);
    }
  }

  function makeRay(width, height) {
    const region = centerRegion(width, height);
    const anchor = randomPointInRegion(region);
    const angle = random(0, Math.PI * 2);
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    const segment = raySegment(anchor, direction, width, height);
    if (segment) {
      return {
        start: segment.start,
        end: segment.end,
        phase: "telegraph",
        phaseRemaining: 1,
        progress: 0,
        hasDealtDamage: false
      };
    }

    return {
      start: { x: 0, y: random(0, height) },
      end: { x: width, y: random(0, height) },
      phase: "telegraph",
      phaseRemaining: 1,
      progress: 0,
      hasDealtDamage: false
    };
  }

  function nextRayInterval(time) {
    const multiplier = difficultyMultiplier();
    if (isChillDifficulty) {
      const interval = gameMode === "extreme" ? constants.hardExtremeRayInterval : constants.hardNormalRayInterval;
      return interval * multiplier;
    }

    const timeAfterStart = Math.max(0, time - 10);
    const baseInterval = Math.max(0.5, 2.5 - timeAfterStart * 0.05);
    const modeInterval = gameMode === "extreme" ? baseInterval * 1.4 : baseInterval;
    return modeInterval * multiplier;
  }

  function centerRegion(width, height) {
    return {
      x: width / 2,
      y: height / 2,
      radius: Math.min(width, height) * 0.18
    };
  }

  function randomPointInRegion(region) {
    const angle = random(0, Math.PI * 2);
    const radius = Math.sqrt(random(0, 1)) * region.radius;
    return {
      x: region.x + Math.cos(angle) * radius,
      y: region.y + Math.sin(angle) * radius
    };
  }

  function raySegment(point, direction, width, height) {
    const intersections = [];

    if (Math.abs(direction.x) > 0.0001) {
      const tLeft = (0 - point.x) / direction.x;
      const yLeft = point.y + tLeft * direction.y;
      if (yLeft >= 0 && yLeft <= height) intersections.push({ t: tLeft, point: { x: 0, y: yLeft } });

      const tRight = (width - point.x) / direction.x;
      const yRight = point.y + tRight * direction.y;
      if (yRight >= 0 && yRight <= height) intersections.push({ t: tRight, point: { x: width, y: yRight } });
    }

    if (Math.abs(direction.y) > 0.0001) {
      const tTop = (0 - point.y) / direction.y;
      const xTop = point.x + tTop * direction.x;
      if (xTop >= 0 && xTop <= width) intersections.push({ t: tTop, point: { x: xTop, y: 0 } });

      const tBottom = (height - point.y) / direction.y;
      const xBottom = point.x + tBottom * direction.x;
      if (xBottom >= 0 && xBottom <= width) intersections.push({ t: tBottom, point: { x: xBottom, y: height } });
    }

    if (intersections.length < 2) return null;
    intersections.sort((left, right) => left.t - right.t);
    return {
      start: intersections[0].point,
      end: intersections[intersections.length - 1].point
    };
  }

  function playerHitByBeam(ray, beamLength, beamThickness) {
    const lineX = ray.end.x - ray.start.x;
    const lineY = ray.end.y - ray.start.y;
    const totalLength = Math.max(1, Math.hypot(lineX, lineY));
    const direction = { x: lineX / totalLength, y: lineY / totalLength };
    const travel = ray.progress * totalLength;
    const center = {
      x: ray.start.x + direction.x * travel,
      y: ray.start.y + direction.y * travel
    };
    const half = beamLength / 2;
    const start = { x: center.x - direction.x * half, y: center.y - direction.y * half };
    const end = { x: center.x + direction.x * half, y: center.y + direction.y * half };
    return hitPlayerTargetForSegment(start, end, playerRadius() + beamThickness * 0.5);
  }

  function handleCollisions() {
    if (lives <= 0) return;

    const hitRadius = enemyRadius() + playerRadius();
    enemies = enemies.filter((enemy) => {
      const hitTarget = hitPlayerTarget(enemy.x, enemy.y, hitRadius);
      if (!hitTarget) return true;
      applyDamage(hitTarget, enemy.x, enemy.y, enemy.color);
      return false;
    });

    handleGameOverIfNeeded();
  }

  function applyDamage(target, x, y, color) {
    if (gameState !== "playing") return;

    if (isShielded(target)) {
      setShielded(target, false);
      const shieldedPlayer = target === "one" ? player : playerTwo;
      emitParticles(
        Number.isFinite(x) ? x : shieldedPlayer.x,
        Number.isFinite(y) ? y : shieldedPlayer.y,
        "rgba(255, 255, 255, 1)",
        14
      );
      return;
    }

    lives -= 1;
    flashRemaining = Math.max(flashRemaining, 0.2);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      emitParticles(x, y, color, 12);
    }
    handleGameOverIfNeeded();
  }

  function isShielded(target) {
    return target === "one" ? playerOneShielded : playerTwoShielded;
  }

  function setShielded(target, value) {
    if (target === "one") {
      playerOneShielded = value;
    } else {
      playerTwoShielded = value;
    }
  }

  function handleGameOverIfNeeded() {
    if (lives > 0 || gameState !== "playing") return;
    gameState = "gameOver";
    hasPlayedOnce = true;
    recordScore();
    flashRemaining = 1;
    returnHomeRemaining = 1;
    pressedKeys.clear();
    resetTouchControls();
  }

  function targetPlayer(x, y) {
    if (!isDualMode()) return player;
    const primaryDistance = distance(x, y, player.x, player.y);
    const secondaryDistance = distance(x, y, playerTwo.x, playerTwo.y);
    return secondaryDistance < primaryDistance ? playerTwo : player;
  }

  function hitPlayerTarget(x, y, radius) {
    if (distance(x, y, player.x, player.y) <= radius) return "one";
    if (isDualMode() && distance(x, y, playerTwo.x, playerTwo.y) <= radius) return "two";
    return "";
  }

  function hitPlayerTargetForSegment(start, end, radius) {
    let bestTarget = "";
    let bestDistance = Number.POSITIVE_INFINITY;
    const primaryDistance = distanceFromPointToSegment(player, start, end);
    if (primaryDistance <= radius) {
      bestTarget = "one";
      bestDistance = primaryDistance;
    }

    if (isDualMode()) {
      const secondaryDistance = distanceFromPointToSegment(playerTwo, start, end);
      if (secondaryDistance <= radius && secondaryDistance < bestDistance) {
        bestTarget = "two";
      }
    }

    return bestTarget;
  }

  function distanceFromPointToSegment(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
      return distance(point.x, point.y, start.x, start.y);
    }
    const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared, 0, 1);
    const projection = {
      x: start.x + t * dx,
      y: start.y + t * dy
    };
    return distance(point.x, point.y, projection.x, projection.y);
  }

  function isDualMode() {
    return gameMode === "extreme";
  }

  function recordScore() {
    if (hasRecordedThisGame) return;
    hasRecordedThisGame = true;
    leaderboard.push({
      id: makeId(),
      name: "未命名",
      duration: elapsedTime,
      mode: gameMode,
      difficulty: currentDifficultyKey(),
      isNamed: false,
      createdAt: Date.now()
    });
    trimLeaderboard();
    saveLeaderboard();
  }

  function loadLeaderboard() {
    try {
      const raw = window.localStorage.getItem(constants.leaderboardStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((entry) => entry && typeof entry.duration === "number")
        .map((entry) => ({
          id: String(entry.id || makeId()),
          name: String(entry.name || "未命名"),
          duration: entry.duration,
          mode: gameModeOrder.includes(entry.mode) ? entry.mode : "normal",
          difficulty: normalizeLeaderboardDifficulty(entry.difficulty),
          isNamed: Boolean(entry.isNamed),
          createdAt: Number(entry.createdAt || Date.now())
        }));
    } catch {
      return [];
    }
  }

  function saveLeaderboard() {
    try {
      window.localStorage.setItem(constants.leaderboardStorageKey, JSON.stringify(leaderboard));
    } catch {
      // A full or blocked localStorage should not stop the game.
    }
  }

  function normalizeLeaderboardDifficulty(value) {
    const parsed = parseDifficultyKey(value);
    return `${parsed.chill ? "chill" : "standard"}-${parsed.level}`;
  }

  function trimLeaderboard() {
    const trimmed = [];
    for (const item of difficultyKeys()) {
      for (const mode of gameModeOrder) {
        trimmed.push(...leaderboardEntries(mode, item));
      }
    }
    leaderboard = trimmed;
  }

  function leaderboardEntries(mode, item = currentDifficultyKey()) {
    return leaderboard
      .filter((entry) => entry.mode === mode && entry.difficulty === item)
      .sort((left, right) => right.duration - left.duration)
      .slice(0, 3);
  }

  function topLeaderboardDuration(mode = gameMode, item = currentDifficultyKey()) {
    const entries = leaderboardEntries(mode, item);
    return entries.length > 0 ? entries[0].duration : NaN;
  }

  function openLeaderboard() {
    editingEntryId = "";
    renderLeaderboard();
    leaderboardModal.classList.remove("is-hidden");
    difficultyPanel.classList.add("is-hidden");
  }

  function closeLeaderboard() {
    editingEntryId = "";
    leaderboardModal.classList.add("is-hidden");
  }

  function openClearModal() {
    closeLeaderboard();
    difficultyPanel.classList.add("is-hidden");
    clearModalTitle.textContent = "清除记录";
    clearForm.classList.remove("is-hidden");
    clearMessage.classList.add("is-hidden");
    clearPasswordInput.value = "";
    clearModal.classList.remove("is-hidden");
    window.setTimeout(() => clearPasswordInput.focus(), 0);
  }

  function closeClearModal() {
    clearPasswordInput.value = "";
    clearModal.classList.add("is-hidden");
  }

  function confirmClearRecords() {
    if (clearPasswordInput.value === constants.clearPassword) {
      leaderboard = [];
      editingEntryId = "";
      try {
        window.localStorage.removeItem(constants.leaderboardStorageKey);
      } catch {
        saveLeaderboard();
      }
      clearForm.classList.add("is-hidden");
      clearModalTitle.textContent = "已清除";
      clearMessage.textContent = "排行榜记录已清空。";
      clearMessage.classList.remove("is-hidden");
      if (!leaderboardModal.classList.contains("is-hidden")) {
        renderLeaderboard();
      }
      return;
    }

    clearPasswordInput.value = "";
    clearForm.classList.add("is-hidden");
    clearModalTitle.textContent = "密码错误";
    clearMessage.textContent = "密码不正确，未清除记录。";
    clearMessage.classList.remove("is-hidden");
  }

  function renderLeaderboard() {
    const key = currentDifficultyKey();
    const label = difficultyLabelFromKey(key);
    leaderboardTitle.textContent = `排行榜（${label}）`;
    leaderboardList.replaceChildren();

    for (const mode of gameModeOrder) {
      const section = document.createElement("section");
      section.className = "leaderboard-section";

      const header = document.createElement("div");
      header.className = "leaderboard-section-header";

      const title = document.createElement("span");
      title.textContent = gameModeLabels[mode];

      const best = topLeaderboardDuration(mode, key);
      const bestText = document.createElement("span");
      bestText.textContent = Number.isFinite(best) ? `${label} 最高 ${best.toFixed(1)}s` : label;

      header.append(title, bestText);
      section.append(header);

      const entries = leaderboardEntries(mode, key);
      if (entries.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-row";
        empty.textContent = "暂无记录";
        section.append(empty);
      } else {
        entries.forEach((entry, index) => {
          section.append(makeLeaderboardRow(entry, index));
        });
      }

      leaderboardList.append(section);
    }
  }

  function makeLeaderboardRow(entry, index) {
    const row = document.createElement("div");
    row.className = "leaderboard-row";

    const rank = document.createElement("div");
    rank.className = "leaderboard-rank";
    rank.textContent = `${index + 1}.`;

    const nameCell = document.createElement("div");
    if (editingEntryId === entry.id && !entry.isNamed) {
      const input = document.createElement("input");
      input.className = "leaderboard-name-input";
      input.type = "text";
      input.value = entry.name === "未命名" ? "" : entry.name;
      input.placeholder = "输入名称，回车确认";
      input.maxLength = 18;
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          commitEntryName(entry.id, input.value);
        } else if (event.key === "Escape") {
          editingEntryId = "";
          renderLeaderboard();
        }
      });
      input.addEventListener("blur", () => {
        commitEntryName(entry.id, input.value);
      });
      nameCell.append(input);
      window.setTimeout(() => input.focus(), 0);
    } else {
      const button = document.createElement("button");
      button.className = `leaderboard-name-button${entry.isNamed ? "" : " is-editable"}`;
      button.type = "button";
      button.textContent = entry.name;
      button.disabled = entry.isNamed;
      button.addEventListener("click", () => {
        if (entry.isNamed) return;
        editingEntryId = entry.id;
        renderLeaderboard();
      });
      nameCell.append(button);
    }

    const duration = document.createElement("div");
    duration.className = "leaderboard-time";
    duration.textContent = `${entry.duration.toFixed(1)}s`;

    row.append(rank, nameCell, duration);
    return row;
  }

  function commitEntryName(id, value) {
    const trimmed = value.trim();
    if (!trimmed) {
      editingEntryId = "";
      renderLeaderboard();
      return;
    }

    const entry = leaderboard.find((item) => item.id === id);
    if (entry && !entry.isNamed) {
      entry.name = trimmed;
      entry.isNamed = true;
      saveLeaderboard();
    }

    editingEntryId = "";
    renderLeaderboard();
  }

  function setDifficultyLevel(nextLevel) {
    difficultyLevel = clampDifficultyLevel(nextLevel);
    syncUi();
  }

  function toggleChillDifficulty() {
    isChillDifficulty = !isChillDifficulty;
    syncUi();
  }

  function requestGameStart(mode) {
    beginModeAfterPrompts(mode);
  }

  function shouldShowTutorial(mode) {
    return mode === "normal" || mode === "extreme";
  }

  function tutorialMessageForMode(mode) {
    if (mode === "extreme") {
      return "使用左下角和右下角摇杆控制两个飞碟移动，摇动两个摇杆各一圈开始游戏";
    }
    return "使用右下角摇杆控制飞碟移动，摇动摇杆一圈开始游戏";
  }

  function showTutorial(mode) {
    const { width, height } = getViewportSize();
    gameMode = mode;
    gameState = "tutorial";
    lives = gameMode === "normal" ? 3 : 6;
    elapsedTime = 0;
    nextSpawnTime = nextSpawnInterval(0);
    nextRayTime = isChillDifficulty ? 5 : 10;
    flashRemaining = 0;
    returnHomeRemaining = 0;
    stamina = constants.staminaMax;
    playerOneShielded = false;
    playerTwoShielded = false;
    hasRecordedThisGame = false;
    enemies = [];
    activeRays = [];
    particles = [];
    didSpawnInitialEnemies = false;
    resetPlayerPositions(width, height);
    constrainPlayerToGameArea(player);
    constrainPlayerToGameArea(playerTwo);
    tutorialProgress = makeTutorialProgress(mode);
    pendingTutorialMode = mode;
    tutorialMessage.textContent = tutorialMessageForMode(mode);
    tutorialModal.classList.remove("is-hidden");
    difficultyPanel.classList.add("is-hidden");
    closeLeaderboard();
    closeClearModal();
    pressedKeys.clear();
    resetTouchControls();
    syncUi();
  }

  function hideTutorial() {
    tutorialModal.classList.add("is-hidden");
  }

  function makeTutorialProgress(mode) {
    const controls = mode === "extreme" ? ["primary", "secondary"] : ["primary"];
    return Object.fromEntries(
      controls.map((control) => [
        control,
        {
          up: false,
          down: false,
          left: false,
          right: false
        }
      ])
    );
  }

  function updateTutorialProgress() {
    if (!tutorialProgress) return;
    for (const [control, progress] of Object.entries(tutorialProgress)) {
      const direction = movementDirection(control);
      const threshold = 0.1;
      if (direction.y <= -threshold) progress.up = true;
      if (direction.y >= threshold) progress.down = true;
      if (direction.x <= -threshold) progress.left = true;
      if (direction.x >= threshold) progress.right = true;
    }

    const isComplete = Object.values(tutorialProgress).every((progress) =>
      progress.up && progress.down && progress.left && progress.right
    );
    if (isComplete) {
      finishTutorial();
    }
  }

  function finishTutorial() {
    const mode = pendingTutorialMode;
    pendingTutorialMode = "";
    tutorialProgress = null;
    hideTutorial();
    startGame(mode, { preservePlayerPositions: true, preserveTouchControls: true });
  }

  function beginModeAfterPrompts(mode) {
    if (mode === "extreme" && shouldWaitForLandscape()) {
      showOrientationPrompt(mode);
      return;
    }

    pendingLandscapeStartMode = "";
    hideOrientationPrompt();
    if (shouldShowTutorial(mode)) {
      showTutorial(mode);
      return;
    }
    startGame(mode);
  }

  function showOrientationPrompt(mode) {
    pendingLandscapeStartMode = mode;
    orientationModal.classList.remove("is-hidden");
    homeScreen.classList.add("is-hidden");
    difficultyPanel.classList.add("is-hidden");
    closeLeaderboard();
    closeClearModal();
    pressedKeys.clear();
    resetTouchControls();
  }

  function hideOrientationPrompt() {
    orientationModal.classList.add("is-hidden");
  }

  function maybeStartPendingLandscapeMode() {
    if (!pendingLandscapeStartMode || shouldWaitForLandscape()) return;
    const mode = pendingLandscapeStartMode;
    pendingLandscapeStartMode = "";
    hideOrientationPrompt();
    beginModeAfterPrompts(mode);
  }

  function shouldWaitForLandscape() {
    return isLikelyTouchDevice() && !isLandscapeViewport();
  }

  function isLikelyTouchDevice() {
    return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  }

  function syncDifficultyOptions() {
    difficultyLevelText.textContent = difficultyLabelFromParts();
    difficultySlider.value = String(difficultyLevel);
    chillDifficultyButton.classList.toggle("is-active", isChillDifficulty);
    for (const tick of difficultyTicks) {
      tick.classList.toggle("is-active", Number(tick.dataset.level) === difficultyLevel);
    }
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function emitParticles(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      const speed = random(20, 120);
      const angle = random(0, Math.PI * 2);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        burstVx: Math.cos(angle) * speed,
        burstVy: Math.sin(angle) * speed,
        color,
        delay: 0,
        life: random(0.35, 0.65),
        size: random(scaledSize(constants.baseParticleMinSize), scaledSize(constants.baseParticleMaxSize)),
        opacity: random(0.6, 1)
      });
    }
    trimParticles();
  }

  function emitEnemyExpireParticles(x, y, color) {
    const radius = enemyRadius();
    for (let index = 0; index < constants.enemyExpireParticleCount; index += 1) {
      const speed = random(100, 280);
      const angle = random(0, Math.PI * 2);
      const edgeX = x + Math.cos(angle) * radius;
      const edgeY = y + Math.sin(angle) * radius;
      particles.push({
        x: edgeX,
        y: edgeY,
        vx: 0,
        vy: 0,
        burstVx: Math.cos(angle) * speed,
        burstVy: Math.sin(angle) * speed,
        color,
        delay: random(0.18, 0.28),
        life: random(2.25, 3.5),
        size: random(
          scaledSize(constants.baseEnemyExpireParticleMinSize),
          scaledSize(constants.baseEnemyExpireParticleMaxSize)
        ),
        opacity: random(0.7, 1)
      });
    }
    trimParticles();
  }

  function trimParticles() {
    const extraCount = particles.length - constants.maxParticles;
    if (extraCount > 0) {
      particles.splice(0, extraCount);
    }
  }

  function draw() {
    const { width, height } = getViewportSize();

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    drawStars();
    drawParticles();

    if (gameState !== "home") {
      drawRays();
      drawEnemies();
      drawPlayers();
      drawTouchControls();
    }

    flashScreen.style.opacity = String(Math.min(1, flashRemaining / 0.2));
  }

  function drawStars() {
    for (const star of stars) {
      const shimmer = (Math.sin(star.phase) + 1) * 0.5;
      const opacity = clamp(star.baseOpacity + shimmer * 0.4, 0, 1);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawParticles() {
    for (const particle of particles) {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const enemy of enemies) {
      const radius = enemyRadius();
      const lightX = enemy.x - radius * 0.35;
      const lightY = enemy.y - radius * 0.35;
      const gradient = ctx.createRadialGradient(
        lightX,
        lightY,
        radius * 0.2,
        enemy.x,
        enemy.y,
        radius * 1.4
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.34)");
      gradient.addColorStop(0.14, enemy.color);
      gradient.addColorStop(0.55, enemy.color);
      gradient.addColorStop(0.82, "rgba(22, 16, 24, 0.82)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.95)");

      ctx.save();
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = scaledSize(9);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.clip();

      const darkSide = ctx.createRadialGradient(
        enemy.x + radius * 0.42,
        enemy.y + radius * 0.45,
        radius * 0.1,
        enemy.x + radius * 0.45,
        enemy.y + radius * 0.5,
        radius * 1.05
      );
      darkSide.addColorStop(0, "rgba(0, 0, 0, 0.44)");
      darkSide.addColorStop(0.6, "rgba(0, 0, 0, 0.2)");
      darkSide.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = darkSide;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
      ctx.fill();

      const highlight = ctx.createRadialGradient(
        lightX,
        lightY,
        0,
        lightX,
        lightY,
        radius * 0.72
      );
      highlight.addColorStop(0, "rgba(255, 255, 255, 0.36)");
      highlight.addColorStop(0.45, "rgba(255, 255, 255, 0.12)");
      highlight.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
      ctx.lineWidth = Math.max(0.75, scaledSize(1));
      ctx.beginPath();
      ctx.arc(
        enemy.x - radius * 0.08,
        enemy.y - radius * 0.08,
        radius - scaledSize(0.5),
        Math.PI * 1.06,
        Math.PI * 1.76
      );
      ctx.stroke();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.34)";
      ctx.beginPath();
      ctx.arc(
        enemy.x + radius * 0.05,
        enemy.y + radius * 0.05,
        radius - scaledSize(0.5),
        Math.PI * 0.08,
        Math.PI * 0.78
      );
      ctx.stroke();
      ctx.restore();

      drawCraters(enemy);
    }
  }

  function drawCraters(enemy) {
    for (const crater of enemy.craters) {
      const craterX = enemy.x + crater.x * enemyRadius();
      const craterY = enemy.y + crater.y * enemyRadius();
      const craterRadius = enemyRadius() * crater.radius;
      const gradient = ctx.createRadialGradient(
        craterX,
        craterY,
        0,
        craterX,
        craterY,
        craterRadius * 1.2
      );
      gradient.addColorStop(0, `rgba(0, 0, 0, ${0.6 + crater.depth})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.9)");

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = scaledSize(2);
      ctx.shadowOffsetX = scaledSize(0.5);
      ctx.shadowOffsetY = scaledSize(0.8);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(craterX, craterY, craterRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = Math.max(0.75, scaledSize(1));
      ctx.beginPath();
      ctx.arc(craterX, craterY, craterRadius + scaledSize(1), 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = Math.max(0.6, scaledSize(0.8));
      ctx.beginPath();
      ctx.arc(
        craterX - scaledSize(0.4),
        craterY - scaledSize(0.4),
        craterRadius + scaledSize(0.6),
        Math.PI * 1.05,
        Math.PI * 1.75
      );
      ctx.stroke();

      ctx.strokeStyle = "rgba(0, 0, 0, 0.36)";
      ctx.beginPath();
      ctx.arc(
        craterX + scaledSize(0.3),
        craterY + scaledSize(0.3),
        craterRadius + scaledSize(0.5),
        Math.PI * 0.08,
        Math.PI * 0.82
      );
      ctx.stroke();
    }
  }

  function drawRays() {
    for (const ray of activeRays) {
      if (ray.phase === "telegraph") {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
        ctx.lineWidth = rayTelegraphWidth();
        ctx.beginPath();
        ctx.moveTo(ray.start.x, ray.start.y);
        ctx.lineTo(ray.end.x, ray.end.y);
        ctx.stroke();
      } else {
        const beam = beamSegment(ray, rayBeamLength());
        ctx.save();
        ctx.shadowColor = "rgba(255, 0, 0, 0.75)";
        ctx.shadowBlur = 10;
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = rayBeamThickness();
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(beam.start.x, beam.start.y);
        ctx.lineTo(beam.end.x, beam.end.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function beamSegment(ray, beamLength) {
    const lineX = ray.end.x - ray.start.x;
    const lineY = ray.end.y - ray.start.y;
    const totalLength = Math.max(1, Math.hypot(lineX, lineY));
    const direction = { x: lineX / totalLength, y: lineY / totalLength };
    const travel = ray.progress * totalLength;
    const center = {
      x: ray.start.x + direction.x * travel,
      y: ray.start.y + direction.y * travel
    };
    const half = beamLength / 2;
    return {
      start: { x: center.x - direction.x * half, y: center.y - direction.y * half },
      end: { x: center.x + direction.x * half, y: center.y + direction.y * half }
    };
  }

  function drawPlayers() {
    const isBoosting =
      gameMode === "normal" &&
      (pressedKeys.has(" ") || boostPointers.size > 0) &&
      (player.directionX !== 0 || player.directionY !== 0) &&
      stamina > 0;

    if (playerOneShielded) {
      drawShield(player);
    }
    drawPlayer(player, assets.player, "rgba(255, 255, 255, 0.6)", isBoosting);
    if (isDualMode()) {
      if (playerTwoShielded) {
        drawShield(playerTwo);
      }
      drawPlayer(playerTwo, assets.player2, "rgba(0, 255, 255, 0.6)", false);
    }
  }

  function drawShield(target) {
    ctx.save();
    ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
    ctx.shadowBlur = scaledSize(6);
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = shieldLineWidth();
    ctx.beginPath();
    ctx.arc(target.x, target.y, shieldRadius(), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function roundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function drawPlayer(target, image, glowColor, isBoosting) {
    const drawSize = playerDrawSize();
    const half = drawSize / 2;
    const tilt = target.directionX < 0 ? (isBoosting ? -25 : -15) : target.directionX > 0 ? (isBoosting ? 25 : 15) : 0;

    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = scaledSize(8);

    if (image.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, -half, -half, drawSize, drawSize);
    } else {
      drawFallbackShip(half);
    }

    ctx.restore();
  }

  function drawFallbackShip(half) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(0, -half);
    ctx.lineTo(half * 0.78, half * 0.78);
    ctx.lineTo(0, half * 0.35);
    ctx.lineTo(-half * 0.78, half * 0.78);
    ctx.closePath();
    ctx.fill();
  }

  function drawTouchControls() {
    const areas = joystickAreas();
    if (areas.length === 0) return;

    for (const area of areas) {
      drawJoystickArea(area);
    }
  }

  function drawJoystickArea(area) {
    const center = joystickCenter(area);
    const joystick = touchControls[area.id];
    const knob = joystick.active
      ? limitedJoystickPoint(joystick.startX, joystick.startY, joystick.currentX, joystick.currentY)
      : center;
    const baseRadius = Math.min(area.width, area.height) * 0.28;
    const knobRadius = Math.max(16, baseRadius * 0.42);
    const accent = area.id === "secondary" ? "rgba(0, 255, 255, " : "rgba(255, 255, 255, ";

    ctx.save();
    ctx.fillStyle = `${accent}0.12)`;
    ctx.strokeStyle = `${accent}0.28)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, baseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = joystick.active ? `${accent}0.55)` : `${accent}0.32)`;
    ctx.beginPath();
    ctx.arc(knob.x, knob.y, knobRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function joystickCenter(area) {
    return {
      x: area.x + area.width / 2,
      y: area.y + area.height / 2
    };
  }

  function limitedJoystickPoint(startX, startY, currentX, currentY) {
    const dx = currentX - startX;
    const dy = currentY - startY;
    const length = Math.hypot(dx, dy);
    if (length <= constants.joystickMaxDistance) {
      return { x: currentX, y: currentY };
    }
    return {
      x: startX + (dx / length) * constants.joystickMaxDistance,
      y: startY + (dy / length) * constants.joystickMaxDistance
    };
  }

  function normalizeAngle(angle) {
    let adjusted = angle;
    while (adjusted > Math.PI) adjusted -= Math.PI * 2;
    while (adjusted < -Math.PI) adjusted += Math.PI * 2;
    return adjusted;
  }

  function distance(leftX, leftY, rightX, rightY) {
    return Math.hypot(leftX - rightX, leftY - rightY);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function onPointerDown(event) {
    if (!shouldHandleGamePointer(event)) return;

    event.preventDefault();
    const point = pointerPoint(event);
    const area = joystickAreaAt(point.x, point.y);
    if (area) {
      startJoystick(area, event.pointerId, point.x, point.y);
      return;
    }

    if (gameMode === "normal") {
      boostPointers.add(event.pointerId);
    }
  }

  function onPointerMove(event) {
    const joystick = joystickForPointer(event.pointerId);
    if (!joystick) return;
    event.preventDefault();
    updateJoystick(joystick, event.clientX, event.clientY);
  }

  function onPointerUp(event) {
    const joystick = joystickForPointer(event.pointerId);
    if (joystick) {
      event.preventDefault();
      stopJoystick(joystick);
    }
    boostPointers.delete(event.pointerId);
  }

  function onTouchGesture(event) {
    if (gameState === "playing" || gameState === "tutorial") {
      event.preventDefault();
    }
  }

  function onViewportChange() {
    resizeCanvas();
    maybeStartPendingLandscapeMode();
  }

  function scheduleViewportChange() {
    onViewportChange();
    [120, 300, 700].forEach((delay) => {
      window.setTimeout(onViewportChange, delay);
    });
  }

  function addViewportListeners(sourceWindow) {
    if (!sourceWindow) return;
    sourceWindow.addEventListener("resize", scheduleViewportChange);
    sourceWindow.addEventListener("orientationchange", scheduleViewportChange);
    if (sourceWindow.visualViewport) {
      sourceWindow.visualViewport.addEventListener("resize", scheduleViewportChange);
      sourceWindow.visualViewport.addEventListener("scroll", scheduleViewportChange);
    }
  }

  function shouldHandleGamePointer(event) {
    if (!["playing", "tutorial"].includes(gameState) || !["normal", "extreme"].includes(gameMode)) return false;
    if (event.pointerType === "mouse" && event.button !== 0) return false;
    if (isInteractiveTarget(event.target)) return false;
    return true;
  }

  function isInteractiveTarget(target) {
    return Boolean(
      target &&
        target.closest &&
        target.closest("button, input, textarea, select, .modal-backdrop, .difficulty-panel")
    );
  }

  function pointerPoint(event) {
    return {
      x: event.clientX,
      y: event.clientY
    };
  }

  function pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  function joystickAreaAt(x, y) {
    return joystickAreas().find((area) => pointInRect(x, y, area)) || null;
  }

  function joystickForPointer(pointerId) {
    return Object.values(touchControls).find((joystick) => joystick.pointerId === pointerId) || null;
  }

  function startJoystick(area, pointerId, x, y) {
    const joystick = touchControls[area.id];
    joystick.active = true;
    joystick.pointerId = pointerId;
    const center = joystickCenter(area);
    joystick.startX = center.x;
    joystick.startY = center.y;
    updateJoystick(joystick, x, y);
  }

  function updateJoystick(joystick, x, y) {
    if (!joystick.active) return;

    const knob = limitedJoystickPoint(joystick.startX, joystick.startY, x, y);
    const dx = knob.x - joystick.startX;
    const dy = knob.y - joystick.startY;
    const distance = Math.hypot(dx, dy);
    const deadZone = 8;

    joystick.currentX = knob.x;
    joystick.currentY = knob.y;
    if (distance <= deadZone) {
      joystick.directionX = 0;
      joystick.directionY = 0;
      return;
    }

    joystick.directionX = dx / constants.joystickMaxDistance;
    joystick.directionY = dy / constants.joystickMaxDistance;
  }

  function stopJoystick(joystick) {
    joystick.active = false;
    joystick.pointerId = null;
    joystick.currentX = joystick.startX;
    joystick.currentY = joystick.startY;
    joystick.directionX = 0;
    joystick.directionY = 0;
  }

  function resetTouchControls() {
    stopJoystick(touchControls.primary);
    stopJoystick(touchControls.secondary);
    boostPointers.clear();
  }

  startButton.addEventListener("click", () => requestGameStart("normal"));
  extremeButton.addEventListener("click", () => requestGameStart("extreme"));
  leaderboardButton.addEventListener("click", openLeaderboard);
  clearEntryButton.addEventListener("click", openClearModal);
  closeLeaderboardButton.addEventListener("click", closeLeaderboard);
  leaderboardModal.addEventListener("click", (event) => {
    if (event.target === leaderboardModal) {
      closeLeaderboard();
    }
  });
  closeClearButton.addEventListener("click", closeClearModal);
  confirmClearButton.addEventListener("click", confirmClearRecords);
  clearModal.addEventListener("click", (event) => {
    if (event.target === clearModal) {
      closeClearModal();
    }
  });
  clearPasswordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      confirmClearRecords();
    }
  });
  difficultyButton.addEventListener("click", () => {
    difficultyPanel.classList.toggle("is-hidden");
  });
  difficultySlider.addEventListener("input", () => {
    setDifficultyLevel(difficultySlider.value);
  });
  for (const tick of difficultyTicks) {
    tick.addEventListener("click", () => {
      setDifficultyLevel(tick.dataset.level);
    });
  }
  chillDifficultyButton.addEventListener("click", toggleChillDifficulty);
  window.addEventListener("click", (event) => {
    if (!difficultyPanel.contains(event.target) && event.target !== difficultyButton) {
      difficultyPanel.classList.add("is-hidden");
    }
  });
  addViewportListeners(window);
  try {
    if (window.parent && window.parent !== window) {
      addViewportListeners(window.parent);
    }
  } catch (error) {
    // Cross-origin embeds cannot read the parent viewport, so local listeners are used.
  }
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("pointerdown", onPointerDown, { passive: false });
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp, { passive: false });
  window.addEventListener("pointercancel", onPointerUp, { passive: false });
  window.addEventListener("blur", resetTouchControls);
  window.addEventListener("touchstart", onTouchGesture, { passive: false });
  window.addEventListener("touchmove", onTouchGesture, { passive: false });
  tutorialModal.addEventListener("click", (event) => {
    if (pendingTutorialMode && event.target === tutorialModal) event.preventDefault();
  });

  resizeCanvas();
  syncUi();
  requestAnimationFrame(frame);
})();
