Config = {
  debug: false,

  // canvas size
  canvasWidth: 320,
  canvasHeight: 180,

  //physics
  velocityCap: 20,
  airDamping: 0.01,

  // area of interaction
  aoi: 0, // can't get this to work for some reason
  highlightColor: "#fff",

  itemOpacity: 0.75,

  startingRoom: "test",

  // palettes
  // colors should be six digit hex codes -- anything else will cause a bug
  palettes: {
    default: {
      Black: "#20283d",
      DGray: "#426e5d",
      LGray: "#e5b083",
      White: "#fbf7f3",
    },
    test: {
      Black: "#ff0000",
      DGray: "#ffff00",
      LGray: "#000000",
      White: "#ffffff",
    },
  },
  
  // keymap
  keyMap: {
    left: "ArrowLeft",
    right: "ArrowRight",
    jump: "ArrowUp",
    down: "ArrowDown",
    pickup: "z",
    place: "Shift",
    interact: "x",
  },

  // collision map
  cmColors: {
    wall: [255, 0, 0]
  },
};
