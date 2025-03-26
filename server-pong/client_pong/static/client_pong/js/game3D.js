// game3D.js (ES Module)

// Importa a versão ES Module do Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

(() => {
  // Cria o objeto global "gameLogic" no window.
  const gameLogic = {};

  // -------------------------------------------------------
  // 1. Estado centralizado do jogo
  // -------------------------------------------------------
  gameLogic.gameState = {
    gameStarted: false,
    paused: false,
    animationFrameId: null,
  };

  // -------------------------------------------------------
  // 2. Variáveis centrais
  // -------------------------------------------------------
  let scene, camera, renderer;
  let paddle1, paddle2, ball;
  let floor, walls = [];
  let keysPressed = {};
  let ballSpeed = 0.2;
  let paddleSpeed = 0.5;
  let ballDirection = new THREE.Vector3(1, 0, 1).normalize();
  let score1 = 0, score2 = 0;
  let gameContainer = null;
  let countdownOverlay = null;

  // Expondo variáveis, se precisar acessá-las externamente
  gameLogic.scene = () => scene;
  gameLogic.camera = () => camera;
  gameLogic.renderer = () => renderer;
  gameLogic.paddle1 = () => paddle1;
  gameLogic.paddle2 = () => paddle2;
  gameLogic.ball = () => ball;
  gameLogic.floor = () => floor;
  gameLogic.walls = () => walls;
  gameLogic.keysPressed = () => keysPressed;

  // -------------------------------------------------------
  // 3. initGame: inicializa a cena e os objetos
  // -------------------------------------------------------
  gameLogic.initGame = function initGame() {
    initContainer();
    initScene();
    initCamera();
    initRenderer();
    initLight();
    applySettings();
    initObjects();
    bindEvents();
  };

  // -------------------------------------------------------
  // 4. Funções internas de inicialização
  // -------------------------------------------------------
  function initContainer() {
    gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
      console.error('Game container not found!');
      return;
    }
    countdownOverlay = document.getElementById('countdownOverlay');
  }

  function initScene() {
    scene = new THREE.Scene();
  }

  function initCamera() {
    camera = new THREE.PerspectiveCamera(
      60,
      gameContainer.clientWidth / gameContainer.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 40, 30);
    camera.lookAt(0, 0, 0);
  }

  function initRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    gameContainer.appendChild(renderer.domElement);
  }

  function initLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 20, 10);
    scene.add(light);
  }

  // Lê as configurações de velocidade dos inputs
  function applySettings() {
    const bs = document.getElementById('ballSpeed');
    const ps = document.getElementById('paddleSpeed');
    ballSpeed = parseFloat(bs?.value) || 0.2;
    paddleSpeed = parseFloat(ps?.value) || 0.5;
  }
  gameLogic.applySettings = applySettings;

  // -------------------------------------------------------
  // 5. updateGameSettings: atualiza speeds e cores
  // -------------------------------------------------------
  gameLogic.updateGameSettings = function updateGameSettings() {
    ballSpeed = parseFloat(document.getElementById('ballSpeed')?.value) || 0.2;
    paddleSpeed = parseFloat(document.getElementById('paddleSpeed')?.value) || 0.5;

    if (floor && floor.material) {
      const newFloorColor = document.getElementById('floorColor')?.value || '#ffff66';
      floor.material.color.set(newFloorColor);
    }
    if (walls.length > 0) {
      const newWallColor = document.getElementById('wallColor')?.value || '#9999ff';
      walls.forEach(wall => {
        if (wall.material) {
          wall.material.color.set(newWallColor);
        }
      });
    }
    if (paddle1 && paddle1.material) {
      const newPaddle1Color = document.getElementById('paddle1Color')?.value || '#ff0000';
      paddle1.material.color.set(newPaddle1Color);
    }
    if (paddle2 && paddle2.material) {
      const newPaddle2Color = document.getElementById('paddle2Color')?.value || '#0000ff';
      paddle2.material.color.set(newPaddle2Color);
    }
    if (ball && ball.material) {
      const newBallColor = document.getElementById('ballColor')?.value || '#ff0000';
      ball.material.color.set(newBallColor);
    }
  };

  // Cria os objetos do jogo: chão, paredes, paddles, bola
  function initObjects() {
    // Floor
    const floorColor = document.getElementById('floorColor')?.value || '#ffff66';
    const floorMaterial = new THREE.MeshBasicMaterial({ color: floorColor });
    floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Walls
    const wallColor = document.getElementById('wallColor')?.value || '#9999ff';
    const wallMaterial = new THREE.MeshBasicMaterial({ color: wallColor });
    const wallGeometry = new THREE.BoxGeometry(40, 2, 1);

    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.z = -10;
    scene.add(wall1);
    walls.push(wall1);

    const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.position.z = 10;
    scene.add(wall2);
    walls.push(wall2);

    // Paddles
    const paddleGeometry = new THREE.BoxGeometry(1, 2, 4);
    const paddle1Color = document.getElementById('paddle1Color')?.value || '#ff0000';
    const paddleMaterial1 = new THREE.MeshPhongMaterial({ color: paddle1Color });
    paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial1);
    paddle1.position.x = -18;
    scene.add(paddle1);

    const paddle2Color = document.getElementById('paddle2Color')?.value || '#0000ff';
    const paddleMaterial2 = new THREE.MeshPhongMaterial({ color: paddle2Color });
    paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial2);
    paddle2.position.x = 18;
    scene.add(paddle2);

    // Ball
    const ballColor = document.getElementById('ballColor')?.value || '#ff0000';
    const ballMaterial = new THREE.MeshPhongMaterial({ color: ballColor });
    ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), ballMaterial);
    scene.add(ball);
  }

  // Anexa eventos de teclado e resize
  function bindEvents() {
    document.addEventListener('keydown', onDocumentKeyDown);
    document.addEventListener('keyup', onDocumentKeyUp);
    window.addEventListener('resize', onWindowResize, false);
  }

  // Reseta a bola no centro com direção aleatória
  gameLogic.resetBall = function resetBall() {
    if (!ball) return;
    ball.position.set(0, 0.5, 0);
    ballSpeed = parseFloat(document.getElementById('ballSpeed')?.value) || 0.2;
    let angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
    ballDirection = new THREE.Vector3(
      Math.sign(Math.random() - 0.5),
      0,
      Math.tan(angle)
    ).normalize();
  };

  // Atualiza a posição das paddles
  gameLogic.updatePaddles = function updatePaddles() {
    if (!paddle1 || !paddle2) return;

    if (keysPressed['KeyW']) {
      paddle1.position.z -= paddleSpeed;
    }
    if (keysPressed['KeyS']) {
      paddle1.position.z += paddleSpeed;
    }
    if (keysPressed['ArrowUp']) {
      paddle2.position.z -= paddleSpeed;
    }
    if (keysPressed['ArrowDown']) {
      paddle2.position.z += paddleSpeed;
    }
    // Limita o movimento
    paddle1.position.z = THREE.MathUtils.clamp(paddle1.position.z, -8, 8);
    paddle2.position.z = THREE.MathUtils.clamp(paddle2.position.z, -8, 8);
  };

  // Atualiza a bola, colisões e pontuação
  gameLogic.updateBall = function updateBall() {
    if (!ball) return;
    ball.position.addScaledVector(ballDirection, ballSpeed);

    // Rebater em cima/baixo
    if (ball.position.z <= -9.5 || ball.position.z >= 9.5) {
      ballDirection.z *= -1;
      ballSpeed += 0.05;
    }

    // Colisão com raquete esquerda
    if (
      paddle1 &&
      ball.position.x <= paddle1.position.x + 1 &&
      ball.position.x >= paddle1.position.x &&
      ball.position.z <= paddle1.position.z + 2 &&
      ball.position.z >= paddle1.position.z - 2
    ) {
      ballDirection.x = Math.abs(ballDirection.x);
    }

    // Colisão com raquete direita
    if (
      paddle2 &&
      ball.position.x >= paddle2.position.x - 1 &&
      ball.position.x <= paddle2.position.x &&
      ball.position.z <= paddle2.position.z + 2 &&
      ball.position.z >= paddle2.position.z - 2
    ) {
      ballDirection.x = -Math.abs(ballDirection.x);
    }

    // Pontuação
    if (ball.position.x <= -20) {
      score2++;
      updateScore();
      gameLogic.resetBall();
    }
    if (ball.position.x >= 20) {
      score1++;
      updateScore();
      gameLogic.resetBall();
    }
  };

  // Atualiza o scoreboard
  function updateScore() {
    const scoreboard = document.getElementById('scoreboard');
    if (scoreboard) {
      scoreboard.innerText = `Jogador 1: ${score1} | Jogador 2: ${score2}`;
    }
  }

  // Eventos de teclado
  function onDocumentKeyDown(event) {
    keysPressed[event.code] = true;
  }
  function onDocumentKeyUp(event) {
    keysPressed[event.code] = false;
  }

  // Ajusta renderer e câmera no resize
  function onWindowResize() {
    if (!gameContainer || !renderer || !camera) return;
    const width = gameContainer.clientWidth;
    const height = gameContainer.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  // Loop de animação
  gameLogic.animate = function animate() {
    if (gameLogic.gameState.paused) return;
    gameLogic.gameState.animationFrameId = requestAnimationFrame(animate);
    gameLogic.updatePaddles();
    gameLogic.updateBall();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };

  // ---------------------------------------------------------
  // 6. Polling: Verifica a existência dos botões no DOM
  // ---------------------------------------------------------
  const pollInterval = setInterval(() => {
    console.log("[DEBUG] Polling: verificando startGame e updateSettings...");
    const startBtn = document.getElementById('startGame');
    const updateBtn = document.getElementById('updateSettings');
    const countdown = document.getElementById('countdownOverlay');

    // Se os elementos existem, anexamos listeners e paramos o polling
    if (startBtn && updateBtn) {
      console.log("[DEBUG] Botões encontrados. Anexando event listeners.");

      // Botão "Iniciar Jogo"
      startBtn.addEventListener('click', () => {
        gameLogic.initGame();
        if (countdown) countdown.style.display = "none";
        gameLogic.gameState.paused = false;
        gameLogic.animate();
      });

      // Botão "Atualizar Configurações"
      updateBtn.addEventListener('click', () => {
        gameLogic.updateGameSettings();
      });

      clearInterval(pollInterval);
    }
  }, 200);

  // Expõe o objeto global
  window.gameLogic = gameLogic;
})();
