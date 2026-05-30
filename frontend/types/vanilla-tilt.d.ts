declare module 'vanilla-tilt' {
  interface TiltOptions {
    max?: number;
    speed?: number;
    glare?: boolean;
    'max-glare'?: number;
    scale?: number;
  }
  const VanillaTilt: {
    init: (elements: HTMLElement | HTMLElement[], options?: TiltOptions) => void;
  };
  export default VanillaTilt;
}
