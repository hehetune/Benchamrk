import {
  _decorator,
  Component,
  ImageAsset,
  Sprite,
  SpriteFrame,
  Texture2D,
  UITransform,
  VideoPlayer,
} from "cc";
const { ccclass, property } = _decorator;

const vertexFrag = `
    // texture vertex position
    attribute vec2 aVertexPosition;
    varying vec2 vTextureCoord;
    uniform vec4 uScale;
    void main () {
      vTextureCoord =( aVertexPosition + 1.0) / 2.0 ;
      gl_Position = vec4(aVertexPosition, 0, 1) *  uScale;;
    }
  `;

const textureFrag = `
    // texture fragment
    precision mediump float;
    uniform sampler2D uSampler;
    varying vec2 vTextureCoord;
    void main () {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

@ccclass("WebGLHandler")
export class WebGLHandler extends Component {
  @property(VideoPlayer)
  videoPlayer: VideoPlayer = null;

  private gl: WebGL2RenderingContext = null;
  private texture: WebGLTexture = null;
  private count = 0;
  private cost = 0;
  private MAX = 100000;

  private canvas: HTMLCanvasElement = null;
  @property(Sprite)
  private videoSprite: Sprite = null;
  private videoUITransform: UITransform = null;
  private videoSpriteFrame: SpriteFrame = null;
  private videoTexture: Texture2D = null;

  private shaderProgram: WebGLProgram = null;

  start() {
    this.initWebGL();
    //   this.videoPlayer.node.on("ready-to-play", this.onVideoReady, this);
    this.videoPlayer.nativeVideo.src =
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    this.videoPlayer.nativeVideo.autoplay = true;
    this.videoPlayer.nativeVideo.width = 320;
    this.videoPlayer.nativeVideo.height = 180;
    this.videoPlayer.nativeVideo.controls = true;
    this.videoPlayer.nativeVideo.crossOrigin = "anonymous";

    this.videoUITransform = this.videoSprite.node.getComponent(UITransform);
    this.videoUITransform.setContentSize(320, 180);
    // this.videoSpriteFrame = new SpriteFrame();
    // this.videoTexture = new Texture2D();
    // this.videoSpriteFrame.texture = this.videoTexture;
    // this.videoSprite.spriteFrame = this.videoSpriteFrame;
  }

  initWebGL() {
    // Create an HTML5 canvas
    this.canvas = document.createElement("canvas");

    // const cocoContainer = document.getElementById("Cocos3dGameContainer");
    // cocoContainer.appendChild(this.canvas);

    // Set the size of the canvas
    this.canvas.width = 1280; // Example width
    this.canvas.height = 720; // Example height
    // this.canvas.style.width = "320px"; // Example display width
    // this.canvas.style.height = "180px"; // Example display height
    // this.canvas.style.visibility = "visible";
    // this.canvas.style.position = "absolute";
    // this.canvas.style.top = "0px";
    // this.canvas.style.right = "0px";
    // this.canvas.style.transformOrigin = "0px 100% 0px";
    // this.canvas.style.zIndex = "0";
    // this.canvas.style.objectFit = "fill";
    // this.canvas.style.transform = "matrix(1, 0, 0, 1, -135, 150)";
    // this.canvas.style.opacity = "0";

    // Set WebGL context for canvas
    this.gl = this.canvas.getContext("webgl2") as WebGL2RenderingContext;

    const { vertexShader, fragmentShader } = this.initRenderShader(this.gl);
    this.shaderProgram = this.createProgram(
      this.gl,
      vertexShader,
      fragmentShader
    );

    const positionVertices = new Float32Array([
      -1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0,
    ]);

    const aVertexPositionLocation = this.gl.getAttribLocation(
      this.shaderProgram,
      "aVertexPosition"
    );
    const uScaleVectorLocation = this.gl.getUniformLocation(
      this.shaderProgram,
      "uScale"
    );
    this.setShaderBuffer(this.gl, aVertexPositionLocation, positionVertices);

    this.gl.uniform4fv(uScaleVectorLocation, [1, 1, 0.0, 1.0]);

    const uSamplerLocation = this.gl.getUniformLocation(
      this.shaderProgram,
      "uSampler"
    );
    this.gl.uniform1i(uSamplerLocation, 0);

    this.texture = this.createTexture(this.gl);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
  }

  initRenderShader(gl: WebGL2RenderingContext) {
    const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vertexFrag);
    const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, textureFrag);
    return {
      vertexShader,
      fragmentShader,
    };
  }

  loadShader(gl: WebGL2RenderingContext, type: number, source: string) {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
      console.log("shader not compiled!");
      console.log(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  createProgram(
    gl: WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ) {
    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    return program;
  }

  createTexture(gl: WebGL2RenderingContext) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  setShaderBuffer(
    gl: WebGL2RenderingContext,
    location: number,
    vertices: ArrayBufferView
  ) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
  }

  private clicked: boolean = false;

  onVideoReady() {
    // this.gl.texImage2D(
    //   this.gl.TEXTURE_2D,
    //   0,
    //   this.gl.RGB,
    //   this.gl.RGB,
    //   this.gl.UNSIGNED_BYTE,
    //   this.videoPlayer.nativeVideo
    // );
    this.clicked = true;
    this.videoTexture = new Texture2D();
    this.videoSpriteFrame = new SpriteFrame();
    // this.render();
  }

  showCopyCanvas() {
    //   this.initWebGL();
    this.onVideoReady();
    // this.canvas.style.opacity = "1";
  }

  private _time: number = 0;
  private _accumulator: number = 0;
  private FIXED_DELTA_TIME: number = 1 / 60;

  protected update(deltaTime: number): void {
    this._time += deltaTime;

    this._accumulator += deltaTime;

    if (this._accumulator >= this.FIXED_DELTA_TIME) {
      this.fixedUpdate();
      this._accumulator -= this.FIXED_DELTA_TIME;
    }
  }

  protected fixedUpdate() {
    if (!this.clicked) return;
    this.render();
  }
  private imageAsset: ImageAsset = null;
  render() {
    if (this.count >= this.MAX) {
      console.info({
        type: "webGL2-texture",
        count: this.count,
        cost: this.cost,
        per: this.cost / this.count,
      });
      return;
    }

    this.count++;
    let t = performance.now();

    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGB,
      this.gl.RGB,
      this.gl.UNSIGNED_BYTE,
      this.videoPlayer.nativeVideo
    );
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    // Trigger updates for texture and sprite frame
    // this.videoTexture.reset(this.canvas);
    // this.videoTexture.image = new ImageAsset(this.canvas);
    // this.videoSpriteFrame.reset();
    // this.videoSpriteFrame.texture = this.videoTexture;
    // this.videoSprite.spriteFrame = this.videoSpriteFrame;

    // this.imageAsset. = this.canvas;

    // // Trigger updates for texture and sprite frame
    // this.videoTexture.uploadData(this.imageAsset);
    // this.videoSpriteFrame.texture = this.videoTexture;
    // this.videoSprite.spriteFrame = this.videoSpriteFrame;

    // this.videoTexture.image = new ImageAsset(this.canvas);
    // this.videoTexture.updateMipmaps(0, 1)
    // this.videoTexture.updateImage()
    // this.videoTexture.mipmaps[0] = new ImageAsset(this.canvas);
    this.videoTexture = new Texture2D();
    this.videoTexture.image = new ImageAsset(this.canvas);
    // this.videoSpriteFrame = new SpriteFrame();
    this.videoSpriteFrame.texture = this.videoTexture;
    this.videoSprite.spriteFrame = this.videoSpriteFrame;

    // this.videoTexture = new Texture2D();
    // this.videoTexture.image = new ImageAsset(this.canvas);
    // this.videoSpriteFrame = new SpriteFrame();
    // this.videoSpriteFrame.texture = this.videoTexture;
    // this.videoSprite.spriteFrame = this.videoSpriteFrame;

    const duration = performance.now() - t;
    this.cost += duration;
    // requestAnimationFrame(this.render.bind(this));
  }
}
