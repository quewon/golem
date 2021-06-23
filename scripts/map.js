// map generation

class Map {
  constructor(init) {
    if ('src' in init) {
      this.imageData = Images[init.src].imageData;
      this.width = this.imageData.width;
      this.height = this.imageData.height;
    } else {
      this.width = init.width || Config.canvasWidth;
      this.height = init.height || Config.canvasHeight;
      this.imageData = this.generate();
    }
    this.spawnpoint = init.spawnpoint || [0, 0];

    this.bots = [];

    // walls are black
    this.walls = [];

    if ('src' in init) {
      var wallColor = Config.cmColors.wall;
      var data = Images[init.src.replace(".png", "_cm.png")].imageData.data;

      var i=0;
      for (let y=0; y<this.height; y++) {
        this.walls[y] = [];
        for (let x=0; x<this.width; x++) {
          this.walls[y][x] = false;
          if (
            data[i] == wallColor[0] &&
            data[i+1] == wallColor[1] &&
            data[i+2] == wallColor[2]
          ) {
            this.walls[y][x] = true;
          }
          i+=4;
        }
      }
    }

    console.log("map generated");
  }
  generate() {
    let width = this.width;
    let height = this.height;
    let data;

    var canvas = document.querySelector("#assets");
    canvas.width = width;
    canvas.height = height;
    var _c = canvas.getContext("2d");
    _c.clearRect(0, 0, width, height);

    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {
        _c.fillStyle = Util.randomColor();
        _c.fillRect(x, y, 1, 1);
      }
    }

    data = _c.getImageData(0, 0, width, height);

    console.log("map generated ("+width+"x"+height+")");

    return data
  }
}

