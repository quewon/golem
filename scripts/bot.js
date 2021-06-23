class Bot {
  constructor(init) {
    this.name = init.name;

    let color = init.color || Colors.White;
    this.imageData = Util.changedHue(Images["bot.png"].imageData, color);
    this.setMap(init.map || Maps.Current.name);

    // physics
    this.velocity = [0, 0];
    this.weight = this.imageData.width * this.imageData.height / 100;
    this.stepSize = this.weight * 4;
    this.initialJumpVelocity = this.weight * 20;
    this.terminationVelocity = -this.weight * 12;
    this.gravityScale = 1.3; // changing this to -1 inverts gravity
    this.offGround = false;

    // determine edge pixels for collision calc l8r
    // might as do a nice shaped collider
    // instead of having a dumb box ay
    // note: anchor is on bottom left of sprite & edge pixels should be relative to anchor
    this.edges = [];

    var pixels = [];
    var d = this.imageData.data;
    for (let i=0; i<d.length; i+=4) {
      pixels.push([d[i], d[i+1], d[i+2], d[i+3]]);
    }

    var i=0;
    for (let y=0; y<this.imageData.height; y++) {
      this.edges[y] = [];
      for (let x=0; x<this.imageData.width; x++) {
        this.edges[y][x] = pixels[i];
        i++;
      }
    }

    pixels = [...this.edges];
    this.edges = [];
    for (let y=0; y<pixels.length; y++) {
      for (let x=0; x<pixels[y].length; x++) {
        let isEdge = false;

        // an edge pixel qualifies one of the following
        // - transparent
        // - has less than four adjacent neighbors
        // - has a transparent adjacent neighbor

        if (pixels[y][x][3] == 0) {
          isEdge = true;
        } else if (
          y - 1 < 0 ||
          y + 1 >=  pixels.length ||
          x - 1 < 0 ||
          x + 1 >=  pixels[y].length
        ) {
          isEdge = true;
        } else if (
          pixels[y-1][x][3] == 0 ||
          pixels[y-1][x][3] == 0 ||
          pixels[y][x-1][3] == 0 ||
          pixels[y][x+1][3] == 0
        ) {
          isEdge = true;
        }

        if (isEdge) {
          this.edges.push([x, y]);
        }
      }
    }


    console.log("spawned: "+this.name);
  }
  setMap(name) {
    if ('map' in this) {
      let botsarray = Maps[this.map].bots;
      botsarray.splice(botsarray.indexOf(this.name), 1);
    }

    this.map = name;
    this.position = [
      Maps[name].spawnpoint[0],
      Maps[name].spawnpoint[1],
    ];

    if (this.name == "Player") {
      Maps[name].bots.push(this.name);
    } else {
      Maps[name].bots.unshift(this.name);
    }
  }

  update() {
    this.physicsUpdate();
  }


  // physics

  physicsUpdate() {
    this.velocity[1] += this.weight * this.gravityScale;
    this.velocity[1] = this.velocity[1] / (1+Config.airDamping);

    if (this.velocity[1] > Config.velocityCap) {
      this.velocity[1] = Config.velocityCap
    }

    var x = this.position[0];

    if (this.velocity[1] < 0) {
      for (let i=0; i<Math.abs(this.velocity[1]); i += 0.1) {
        var y = this.position[1] - 0.1;
        if (!this.colliding(x, y)) {
          this.position[1] -= 0.1;
        } else {
          this.velocity[1] = 0;
          this.offGround = false;
          return
        }
      }
    } else {
      for (let i=0; i<this.velocity[1]; i += 0.1) {
        var y = this.position[1] + 0.1;
        if (!this.colliding(x, y)) {
          this.position[1] += 0.1;
        } else {
          this.velocity[1] = 0;
          this.offGround = false;
          return
        }
      }
    }



    // let x = this.position[0];
    // let y = this.position[1] + this.velocity[1];

    // if (!this.colliding(x, y)) {
    //   this.position[1] += this.velocity[1];
    // } else {
    //   this.velocity[1] = 0;
    //   this.offGround = false;
    // }
  }

  move(axis, step) {
    this.position[axis] += step;

    if (this.colliding(this.position[0], this.position[1])) {
      this.position[axis] -= step;
      return;
    }

    //everything under here only runs if a step is taken

    // if (!this.offGround) Audio.steps[Math.random() * Audio.steps.length | 0].play();

    if (this.name == "Player") {
      let x = this.position[0];
      let y = this.position[1];
      let threshX = Maps.Current.width - Util.halfWidth;
      let threshY = Maps.Current.height - Util.halfHeight;
      let camera = Maps.Current.cameraPos;

      if (x > Util.halfWidth && x <= threshX) {
         camera[0] = x - Util.halfWidth;
      }
      if (y > Util.halfHeight && y <= threshY) {
         camera[1] = y - Util.halfHeight;
      }

      updateMap();
    }
  }

  jump() {
    if (!this.offGround) {
      this.velocity[1] -= this.initialJumpVelocity;
      this.offGround = true;
    }
  }
  terminateJump() {
    if (this.velocity[1] < this.terminationVelocity) {
      this.velocity[1] = this.terminationVelocity;
    }

    // glide effect
    // this.velocity[1] = this.velocity[1] / 2;
  }

  colliding(x, y) {
    x = Math.floor(x);
    y = Math.floor(y - this.imageData.height);

    var walls = Maps[this.map].walls;
    var width = Maps[this.map].width;
    var height = Maps[this.map].height;
    // go through edge pixels of player
    // check if it matches up with any wall pixels
    // if so velocity = 0
    for (let px in this.edges) {
      let pos = this.edges[px];

      let wy = y+pos[1];
      let wx = x+pos[0];

      if (
        wy >= height ||
        wx >= width ||
        wx < 0
      ) {
        return true
      } else if (
        wy < 0
      ) {
        return false
      }

      let wall = walls[y+pos[1]][x+pos[0]];

      if (wall) {
        return true
      }
    }
  }
}