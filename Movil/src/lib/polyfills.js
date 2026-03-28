// src/lib/polyfills.js
// DOM Polyfills for Three.js in Expo Go environment

if (typeof global.document === 'undefined') {
  global.document = {
    createElement: (tag) => {
      if (tag === 'canvas') {
        return {
          getContext: () => ({
            fillStyle: '',
            fillRect: () => {},
            drawImage: () => {},
            getImageData: () => ({ data: [] }),
            putImageData: () => {},
            createImageData: () => ({ data: [] }),
            setTransform: () => {},
            translate: () => {},
            scale: () => {},
            rotate: () => {},
          }),
          style: {},
          width: 0,
          height: 0,
          addEventListener: () => {},
          removeEventListener: () => {},
        };
      }
      return {};
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

if (typeof global.HTMLCanvasElement === 'undefined') {
  global.HTMLCanvasElement = class {
    constructor() {}
  };
}
