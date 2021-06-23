Config = {
  // canvas size
  canvasWidth: 320,
  canvasHeight: 180,

  velocityCap: 20,
  airDamping: 0.02,

  startingRoom: "graveyard",

  // palettes
  palettes: {
    default: {
      Black: "#20283d",
      DGray: "#426e5d",
      LGray: "#e5b083",
      White: "#fbf7f3",
    },
  },
  
  // keymap
  keyMap: {
    left: "ArrowLeft",
    right: "ArrowRight",
    jump: "ArrowUp",
  },

  // collision map
  cmColors: {
    wall: [255, 0, 0]
  },
};
