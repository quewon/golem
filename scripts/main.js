function init() {
  // canvases
  Canvas.bg = document.getElementById("bg"); //background
  Canvas.ch = document.getElementById("ch"); //characters
  Canvas.fg = document.getElementById("fg"); //foreground

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
    src: "maps/graveyard.png",
  });
  Maps.test = new Map({
    spawnpoint: ["random", 20],
    src: "maps/test.png",
  });

  // player
  Items.Player = new Bot({
    name: "Player", //name must be the same as object name
    color: Colors.Black,
    map: Config.startingRoom,
    src: "modules/body/player.png",
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

  window.addEventListener("blur", function(e) {
    for (let key in Key.Handler) {
      Key.Handler[key] = false;
    }
  });

  // initialize other bots

  for (let i=0; i<3; i++) {
    Items["dummy"+i] = new Bot({
      name: "dummy"+i,
      map: "test",
      src: [
        "modules/body/m.png",
        "modules/body/racecar.png",
        "modules/body/obelisk.png",
        "modules/body/t.png",
        "modules/body/tiny.png",
        "modules/body/l.png",
        "modules/body/sofa.png",
        "modules/body/humanoid.png",
      ][Math.random() * 8 | 0],
    })
  }


  // this should come after initializing items
  Maps.Set(Config.startingRoom);
  Colors.Set("default");

  _ch.globalAlpha = Config.moduleOpacity;

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

  let highlighted = "";
  if (Items.Player.canPickUp.length > 0) {
    highlighted = Items.Player.canPickUp[0];
  }

  let items = Maps[current.name].items;
  for (let i in items) {
    let item = Items[items[i]];

    if (item.holder) continue;

    let x = Math.round(item.position[0]+o[0]-c[0]);
    let y = Math.round(item.position[1]+o[1]-c[1]-item.imageData.height);
    if (item.name == highlighted) {
      _ch.globalAlpha = 1;
      _ch.fillRect(x-1, y-1, item.imageData.width+2, item.imageData.height+2);
      _ch.globalAlpha = Config.moduleOpacity;
    }
    if (item.open) {
      _ch.globalAlpha = 1;
      _ch.drawImage(item.img_open, x, y);
      _ch.globalAlpha = Config.moduleOpacity;
    } else {
      _ch.drawImage(item.img, x, y);
    }

    if (item.onHead.length > 0) {
      for (let h in item.onHead) {
        let hname = item.onHead[h];
        let hb;
        hb = Items[hname];
        let x = Math.round(hb.position[0]+o[0]-c[0]);
        let y = Math.round(hb.position[1]+o[1]-c[1]-hb.imageData.height);
        _ch.drawImage(hb.img, x, y);
      }
    }
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
        case map.interact:
          if (!p.isInteracting) p.interact();
          break;
      }
    }
  }

  if (!Key.Handler[map.jump] && p.offGround) p.terminateJump();
  if (!Key.Handler[map.place] && p.isPlacing) p.isPlacing = false;
  if (!Key.Handler[map.pickup] && p.isPickingUp) p.isPickingUp = false;
  if (!Key.Handler[map.interact] && p.isInteracting) p.isInteracting = false;
}