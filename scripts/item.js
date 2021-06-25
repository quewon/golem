class Item {
  constructor(init) {
    this.name = init.name;

    let color = init.color || Colors.White;

    if ('color' in init) {
      this.imageData = Util.changedHue(Images[init.src].imageData, color);
    } else {
      this.imageData = Images[init.src].imageData;
    }
    this.img = Util.dataToImage(this.imageData);

    this.setMap(init.map || Maps.Current.name);

    // physics
    this.velocity = [0, 0];
    this.weight = this.img.width * this.img.height / 100;
    this.stepSize = this.weight * 5;
    this.initialJumpVelocity = this.weight * 10;
    this.gravityScale = 1; // changing this to -1 inverts gravity
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
    for (let y=0; y<this.img.height; y++) {
      this.edges[y] = [];
      for (let x=0; x<this.img.width; x++) {
        this.edges[y][x] = pixels[i];
        i++;
      }
    }

    pixels = [...this.edges];
    this.edges = [];
    for (let y=0; y<pixels.length; y++) {
      for (let x=0; x<pixels[y].length; x++) {
        let isEdge = false;

        // an edge pixel qualifies the following

        if (pixels[y][x][3] == 0) { // - not transparent
          continue
        }

        if ( // has less than four adjacent neighbors
          y - 1 < 0 ||
          y + 1 >=  pixels.length ||
          x - 1 < 0 ||
          x + 1 >=  pixels[y].length
        ) {
          isEdge = true;
        } else if ( // or has a transparent neighbor
          pixels[y-1][x][3] == 0 ||
          pixels[y+1][x][3] == 0 ||
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

    this.topEdges = [];
    for (let x=0; x<this.img.width; x++) {
      search: for (let e in this.edges) {
        let edge = this.edges[e];
        if (edge[0] == x) {
          this.topEdges.push(edge);
          break search;
        }
      }
    }

    this.bottomEdges = [];
    for (let x=0; x<this.img.width; x++) {
      search: for (let e=this.edges.length-1; e>=0; e--) {
        let edge = this.edges[e];
        if (edge[0] == x) {
          this.bottomEdges.push(edge);
          break search;
        }
      }
    }


    // picking things up, putting things down
    this.onHead = [];   this.holder = null;
    this.modules = [];
    this.isPlacing = false;
    this.isPickingUp = false;

    console.log("spawned: "+this.name);
  }

  setMap(name) {
    if ('map' in this) {
      let itemsarray = Maps[this.map].items;
      itemsarray.splice(itemsarray.indexOf(this.name), 1);
    }

    this.map = name;
    this.position = [
      Maps[name].spawnpoint[0],
      Maps[name].spawnpoint[1],
    ];

    if (this.name == "Player") {
      Maps[name].items.push(this.name);
    } else {
      Maps[name].items.unshift(this.name);
    }

    this.canPickUp = [];
  }

  update() {
    this.canPickUp = [];

    let px = this.position[0] - Config.aoi;
    let pwidth = this.img.width + Config.aoi;
    let pheight = this.img.height + Config.aoi;
    let py = this.position[1] - Config.aoi - pheight;

    // everything interactable (items, bots) is an item
    let is = Maps[Maps.Current.name].items;

    for (let i in is) {
      let item = Items[is[i]];

      if (item.name == this.name) continue;

      let ix = item.position[0];
      let iwidth = item.img.width;
      let iheight = item.img.height;
      let iy = item.position[1] - iheight;

      if (
        ix < px + pwidth  &&
        ix + iwidth > px &&
        iy < py + pheight &&
        iheight + iy > py
      ) {
        if (this.onHead.indexOf(item.name) == -1) {
          this.canPickUp.unshift(item.name);
        }
      }
    }

    if (this.holder) {
      let holder = Items[this.holder];

      this.position[0] = holder.position[0] + holder.img.width/2 - this.img.width/2;
    }
  }

  disconnect() {
    let holder = Items[this.holder];
    holder.onHead.splice(holder.onHead.indexOf(this.name), 1);
    this.holder = null;
  }

  // physics

  physicsUpdate() {
    this.velocity[1] += this.weight * this.gravityScale;
    this.velocity[1] = this.velocity[1] / (1+Config.airDamping);

    if (this.velocity[1] > Config.velocityCap) {
      this.velocity[1] = Config.velocityCap
    }

    if (this.velocity[1] > 1) {
      this.offGround = true;
    }

    var x = this.position[0];

    var increment = 1;

    if (this.velocity[1] < 0) { //going up
      for (let i=0; i<Math.abs(this.velocity[1]); i += increment) {
        var y = this.position[1] - increment;
        if (!this.colliding(x, y)) {
          this.position[1] -= increment;
        } else {
          this.velocity[1] = 0;
          return
        }

        for (let i in this.onHead) {
          let child = Items[this.onHead[i]];
          let cx = child.position[0];
          let cy = child.position[1] - increment;
          if (!child.colliding(cx,cy)) {
            child.position[1] -= increment;
          } else {
            console.log("child collides");
            this.position[1] += increment;
            return
          }
        }
      }
    } else { // you are falling
      for (let i=0; i<this.velocity[1]; i += increment) {
        var y = this.position[1] + increment;
        if (!this.colliding(x,y) && !this.collidingWithItem(x,y)) {
          this.position[1] += increment;
        } else {
          this.ground();
          return
        }
      }
    }
  }

  ground() {
    this.velocity[1] = 0;
    this.position[1] = Math.round(this.position[1]);

    if (this.name == "Player") {
      if (this.offGround) Audio.jump.play();
    }

    this.offGround = false;
  }

  collidingWithItem(x, y) {
    x = Math.round(x);
    y = Math.floor(y - this.img.height);

    let dir;
    if (this.velocity[1] > 0) {
      dir = "down";
    }

    if (dir=="down") {
      if (this.holder) { //only collide with holder && things holder is holding
        let item = Items[this.holder];

        let ix = Math.round(item.position[0]);
        let iy = Math.floor(item.position[1] - item.img.height);

        for (let bx in item.topEdges) {
          let bEdge = item.topEdges[bx];
          for (let tx in this.bottomEdges) {
            let edge = this.bottomEdges[tx];
            if (
              x+edge[0] == ix+bEdge[0] &&
              y+edge[1] >= iy+bEdge[1]
            ) {
              return true
            }
          }
        }

        let items = Items[this.holder].onHead;
        for (let i in items) {
          let item = Items[items[i]];
          if (item.name == this.name) break

          let ix = Math.round(item.position[0]);
          let iy = Math.floor(item.position[1] - item.img.height);

          for (let bx in item.topEdges) {
            let bEdge = item.topEdges[bx];
            for (let tx in this.bottomEdges) {
              let edge = this.bottomEdges[tx];
              if (
                x+edge[0] == ix+bEdge[0] &&
                y+edge[1] >= iy+bEdge[1]
              ) {
                return true
              }
            }
          }
        }
      } else {
        let items = Maps[Maps.Current.name].items;
        for (let i in items) {
          let item = Items[items[i]];
          if (item.name == this.name) continue

          let ix = Math.round(item.position[0]);
          let iy = Math.floor(item.position[1] - item.img.height);

          for (let bx in item.topEdges) {
            let bEdge = item.topEdges[bx];
            for (let tx in this.bottomEdges) {
              let edge = this.bottomEdges[tx];
              if (
                x+edge[0] == ix+bEdge[0] &&
                y+edge[1] == iy+bEdge[1]
              ) {
                return true
              }
            }
          }
        }
      }
    }

    return false
  }

  colliding(x, y) {
    x = Math.round(x);
    y = Math.round(y - this.img.height);

    var walls = Maps[this.map].walls;
    var width = Maps[this.map].width;
    var height = Maps[this.map].height;
    // go through edge pixels of player
    // check if it matches up with any wall pixels
    // if so velocity = 0

    // for (let px in this.bottomEdges) {
    //   let pos = this.bottomEdges[px];

    //   let wy = y+pos[1];
    //   let wx = x+pos[0];

    //   if (
    //     walls[wy-1][wx+1] ||
    //     walls[wy-1][wx-1]
    //   ) {
    //     this.move(1, -this.stepSize);
    //     return "stairs"
    //   }
    // }

    for (let px in this.edges) {
      let pos = this.edges[px];

      let wy = y+pos[1];
      let wx = x+pos[0];

      if ( //colliding with out of bounds
        wy >= height ||
        wx >= width ||
        wx < 0
      ) {
        return true
      } else if (
        wy < 0 //colliding with top of screen
      ) {
        return false
      }

      let wall = walls[wy][wx];

      if (wall) {
        return true
      }
    }
  }
}

class Bot extends Item {
  pickUp() {
    this.isPickingUp = true;

    if (this.canPickUp.length == 0) return

    let item = this.canPickUp[0];

    if (this.onHead.indexOf(item) == -1) {
      let itemobject = Items[item];

      // if there's items on head then put the item way up there
      let newy = itemobject.position[1];
      let yo = this.bottomEdges[Math.floor(this.bottomEdges.length/2)][1] + Math.abs(this.position[1] - itemobject.position[1]) + 1;
      for (let i in this.onHead) {
        let item = Items[this.onHead[i]];
        yo += item.bottomEdges[Math.floor(item.bottomEdges.length/2)][1] + 1;
      }
      newy -= yo;

      // check if collides with wall on pickup
      // if yes, place the bottom item

      let newx = this.position[0] + this.img.width/2 - itemobject.img.width/2;
      while (itemobject.colliding(newx,newy)) {
        if (this.onHead.length <= 0) {
          // can't pick up object
          Audio.cantPickUp.play();
          return
        }
        let item = Items[this.onHead[0]];
        console.log(item.name);
        newy += item.bottomEdges[Math.floor(item.bottomEdges.length/2)][1];
        this.place();
      }

      itemobject.holder = this.name;
      itemobject.position[1] = newy;
      this.onHead.push(item);
    }
  }

  place() {
    this.isPlacing = true;

    if (this.onHead.length == 0) return

    let item = this.onHead[0];
    this.onHead.shift();
    Items[item].holder = null;
    Items[item].move(1, Math.abs(this.position[1]-Items[item].position[1]));
  }

  // phys

  move(axis, step) {
    this.position[axis] += step;

    if (this.colliding(this.position[0], this.position[1])) {
      this.position[axis] -= step;
      return;
    }

    for (let i in this.onHead) {
      let child = Items[this.onHead[i]];
      child.position[axis] += step;
      if (child.colliding(child.position[0], child.position[1])) {
        this.position[axis] -= step;
        child.position[axis] -= step;
        return
      }
      child.position[axis] -= step;
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
    if (this.velocity[1] < -this.initialJumpVelocity) {
      this.velocity[1] = -this.initialJumpVelocity;
    }

    // glide effect
    // this.velocity[1] = this.velocity[1] / 2;
  }
}