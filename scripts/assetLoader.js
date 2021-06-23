function LoadAssets() {
  var images = [
    "bot.png",
    "graveyard.png",
    "graveyard_cm.png",
  ];

  var sound = {
    steps: [
      "0.wav",
      "1.wav",
      "2.wav",
      "3.wav",
      "4.wav",
      "5.wav",
      "6.wav",
      "7.wav",
      "8.wav",
      "9.wav",
    ],
    test: "test.wav",
  };

  LoadImages();

  function LoadImages() {
    const length = images.length;
    let tally = 0;
    let dir = "assets/imgs/";

    for (let file of images) {
      let img = new Image();
      img.src = dir+file;
      img.setAttribute("crossOrigin", "");
      img.onload = function() {
        Images[file] = {};
        Images[file].img = img;
        tally++;
        console.log(tally + "/" + length + " images loaded...");

        if (tally == length) {
          console.log ("all images loaded!");
          LoadAudio();
        }
      }
    }
  }

  function LoadAudio() {
    var dir = "assets/sound/";
    for (lib in sound) {
      if (Array.isArray(sound[lib])) {
        Audio[lib] = [];
        for (sfx in sound[lib]) {
          Audio[lib][sfx] = new Howl({ src: [dir+lib+"/"+sound[lib][sfx]] });
        }
      } else {
        Audio[lib] = new Howl({ src: [dir+sound[lib]] });
      }
    }

    let loading = setInterval(function() {
      // _loading.textContent = config.stars[Math.random() * config.stars.length | 0];

      loaded = true;

      check: for (lib in Audio) {
        if (Array.isArray(Audio[lib])) {
          for (sfx in Audio[lib]) {
            if (Audio[lib][sfx].state() != "loaded") loaded = false;
            break check;
          }
        } else {
          if (Audio[lib].state() != "loaded") {
            loaded = false;
            break check;
          }
        }
      }

      if (loaded) {
        console.log("audio all loaded");
        // _loading.style.display = "none";
        clearInterval(loading);
        GetImageData();
        init_the_sequel();
      }
    }, 100);
  }

  // like ProcessImages, but works with imgs instead of imagedata
  function GetImageData() {
    var _c = document.querySelector("#assets").getContext("2d");

    for (let file in Images) {
      const img = Images[file].img;
      _c.clearRect(0, 0, img.width, img.height);
      _c.drawImage(img, 0, 0);
      Images[file].imageData = _c.getImageData(0, 0, img.width, img.height);
    }
  }
}

function ProcessImages(palette) {
  var oldColors = {
    black: Util.hexToRGBArray(Colors.Black),
    dgray: Util.hexToRGBArray(Colors.DGray),
    lgray: Util.hexToRGBArray(Colors.LGray),
    white: Util.hexToRGBArray(Colors.White),
  };

  palette = Config.palettes[palette];
  var newColors = {
    black: Util.hexToRGBArray(palette.Black),
    dgray: Util.hexToRGBArray(palette.DGray),
    lgray: Util.hexToRGBArray(palette.LGray),
    white: Util.hexToRGBArray(palette.White),
  };

  var queue = [];
  for (let file in Images) {
    queue.push(Images[file].imageData);
  }
  for (let map in Maps) {
    if (map == "Set" || map == "Current") continue;
    queue.push(Maps[map].imageData);
  }

  for (let i in queue) {
    const data = queue[i].data;

    // change old colors to new
    for (let i=0; i<data.length; i += 4) {
      let array = [data[i], data[i+1], data[i+2]];
      for (let color in oldColors) {
        const oc = oldColors[color];
        if (
          array[0] == oc[0] &&
          array[1] == oc[1] &&
          array[2] == oc[2]
        ) {
          const nc = newColors[color];
          data[i] = nc[0];
          data[i+1] = nc[1];
          data[i+2] = nc[2];
        }
      }
    }
  }
}