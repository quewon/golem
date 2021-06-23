function init() {
  // canvases
  Canvas.bg = document.querySelector("#bg"); //background
  Canvas.ch = document.querySelector("#ch"); //characters
  Canvas.fg = document.querySelector("#fg"); //foreground

  // canvas context
  _bg = Canvas.bg.getContext("2d");
  _ch = Canvas.ch.getContext("2d");
  _fg = Canvas.fg.getContext("2d");

  // canvas sizing
  for (let i in Canvas) {
    Canvas[i].width = Config.canvasWidth;
    Canvas[i].height = Config.canvasHeight;
  }
  Util.halfWidth = Config.canvasWidth / 2;
  Util.halfHeight = Config.canvasHeight / 2;

  LoadAssets();
}

// initialization after assets loaded
function init_the_sequel() {
  Colors.Set("default");

  // maps
  Maps.graveyard = new Map({
    spawnpoint: [80, 50],
    src: "graveyard.png",
  });
  Maps.longroom = new Map({
    width: 400,
    height: 100,
    spawnpoint: [150, 20],
  });

  // player
  Bots.Player = new Bot({
    name: "Player", //name must be the same as object name
    color: Colors.Black,
    map: Config.startingRoom,
  });
  Maps.Set(Config.startingRoom);

  // key event listeners
  document.addEventListener("keydown", function(e) {
    if (e.repeat) return;

    let k = e.key;

    Key.Handler[k] = e.type == "keydown";
    Key.History.unshift(k);
    Key.Timer = Key.Interval;
  });

  document.addEventListener("keyup", function(e) {
    let k = e.key;

    Key.Handler[k] = e.type == "keydown";
    if (k == Key.History[0]) {
      Key.History.shift();
    };
  });

  // initialize other bots
  Bots.dummy = new Bot({
    name: "dummy",
    color: Colors.LGray,
    map: "graveyard",
  });

  draw();
  update();
}


// runs every frame
function draw() {
  _ch.clearRect(0, 0, Config.canvasWidth, Config.canvasHeight);

  let current = Maps.Current;
  let o = current.offset;
  let c = current.cameraPos;
  let bots = Maps[current.name].bots;

  for (let i in bots) {
    let bot = Bots[bots[i]];
    _ch.putImageData(bot.imageData, Math.floor(bot.position[0]+o[0]-c[0]), Math.floor(bot.position[1]+o[1]-c[1]-bot.imageData.height));
  }

  window.requestAnimationFrame(draw);
}

// runs when player moves
function updateMap() {
  _bg.clearRect(0, 0, Config.canvasWidth, Config.canvasHeight);

  let current = Maps.Current;
  let data = Maps[current.name].imageData;
  let camera = Maps.Current.cameraPos;
  _bg.putImageData(data, current.offset[0]-camera[0], current.offset[1]-camera[1]);
}

function update() {
  let bots = Maps[Maps.Current.name].bots;

  Key.Update();

  for (let i in bots) {
    let b = Bots[bots[i]];
    b.update();
  }

  window.requestAnimationFrame(update);
}


// runs when keys are pressed
Key.Update = function() {
  const map = Config.keyMap;
  const p = Bots.Player;

  for (let i in Key.Handler) {
    if (Key.Handler[i]) {
      switch (i) {
        case map.left:
          if (Key.History[0] == map.right) break;
          p.move(0, -p.stepSize);
          break;
        case map.right:
          if (Key.History[0] == map.left) break;
          p.move(0, p.stepSize);
          break;
        case map.jump:
          p.jump();
          break;
      }
    }
  }

  if (!Key.Handler[map.jump] && p.offGround) {
    p.terminateJump();
  }
}