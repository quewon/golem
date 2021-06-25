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
  // maps
  Maps.graveyard = new Map({
    spawnpoint: [80, 50],
    src: "graveyard.png",
  });
  Maps.test = new Map({
    spawnpoint: [80, 20],
    src: "test.png",
  });

  // player
  Items.Player = new Bot({
    name: "Player", //name must be the same as object name
    color: Colors.Black,
    map: Config.startingRoom,
    src: "bot.png",
  });

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

  for (let i=0; i<10; i++) {
    Items["dummy"+i] = new Bot({
      name: "dummy"+i,
      map: "test",
      src: ["bot.png", "bot2.png"][Math.random() * 2 | 0],
      color: [Colors.LGray, Colors.DGray][Math.random() * 2 | 0],
    })
  }


  // this should come after initializing items
  Maps.Set(Config.startingRoom);
  Colors.Set("default");

  draw();
}


// runs every frame
function draw() {
  _ch.clearRect(0, 0, Config.canvasWidth, Config.canvasHeight);
  _fg.clearRect(0, 0, Config.canvasWidth, Config.canvasHeight);

  update();

  let current = Maps.Current;
  let o = current.offset;
  let c = current.cameraPos;
  let items = Maps[current.name].items;

  let highlighted = "";
  if (Items.Player.canPickUp.length > 0) {
    highlighted = Items.Player.canPickUp[0];
  }

  for (let i in items) {
    let item = Items[items[i]];
    let x = Math.round(item.position[0]+o[0]-c[0]);
    let y = Math.round(item.position[1]+o[1]-c[1]-item.imageData.height);
    if (item.name == highlighted) {
      _ch.fillStyle = Config.highlightColor;
      _ch.fillRect(x-1, y-1, item.imageData.width+2, item.imageData.height+2);
    }
    _ch.drawImage(item.img, x, y);
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
  let items = Maps[Maps.Current.name].items;

  for (let i in items) {
    let b = Items[items[i]];
    b.update();
  }

  for (let i in items) {
    let b = Items[items[i]];
    if (b.holder) continue;
    if (b.onHead.length > 0) {
      for (let h=b.onHead.length-1; h>=0; h--) {
        let hb = Items[b.onHead[h]];
        hb.physicsUpdate();
      }
    }
    b.physicsUpdate();
  }

  Key.Update();
}


Key.Update = function() {
  const map = Config.keyMap;
  const p = Items.Player;

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
        case map.down:
          if (!p.offGround) {
            p.move(1, p.stepSize);
          }
          break;
        case map.pickup:
          if (!p.isPickingUp) p.pickUp();
          break;
        case map.place:
          if (!p.isPlacing) p.place();
          break;
      }
    }
  }

  if (!Key.Handler[map.jump] && p.offGround) {
    p.terminateJump();
  }
  if (!Key.Handler[map.place] && p.isPlacing) {
    p.isPlacing = false;
  }
  if (!Key.Handler[map.pickup] && p.isPickingUp) {
    p.isPickingUp = false;
  }
}