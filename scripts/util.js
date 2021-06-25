// utility functions - shortcuts to code used frequently

Util = {
  randomColor: function() {
    return Colors[["Black", "DGray", "LGray", "White"][Math.random() * 4 | 0]]
  },
  hexToRGBArray: function(hex) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b]
  },
  changedHue: function(imageData, color) {
    var canvas = document.getElementById("assets");
    var _c = canvas.getContext("2d");

    let width = imageData.width;
    let height = imageData.height;

    canvas.width = width;
    canvas.height = height;

    _c.clearRect(0, 0, width, height);
    _c.putImageData(imageData, 0, 0);

    _c.globalCompositeOperation = "source-in";
    _c.fillStyle = color;
    _c.fillRect(0, 0, width, height);

    _c.globalCompositeOperation = "source-over";
    imageData = _c.getImageData(0, 0, width, height);

    return imageData
  },
  halfWidth: undefined,
  halfHeight: undefined,
  dataToImage: function(imageData) {
    let canvas = document.getElementById("assets");
    let _c = canvas.getContext("2d");

    canvas.width = imageData.width;
    canvas.height = imageData.height;
    _c.clearRect(0, 0, canvas.width, canvas.height);
    _c.putImageData(imageData, 0, 0);

    let image = new Image();
    image.src = canvas.toDataURL();

    return image
  },
};