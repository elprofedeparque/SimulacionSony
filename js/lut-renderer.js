class CubeLUTRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2');
    if (!this.gl) console.error("WebGL 2 no es compatible con este navegador.");
    
    this.initShaders();
    this.currentImage = null;
    this.currentLUTTexture = null;
  }

  initShaders() {
    const gl = this.gl;

    const vsSource = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
      }`;

    const fsSource = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      uniform sampler2D u_image;
      uniform highp sampler3D u_lut;
      out vec4 fragColor;

      void main() {
        vec4 color = texture(u_image, v_texCoord);
        vec4 gradedColor = texture(u_lut, color.rgb);
        fragColor = vec4(gradedColor.rgb, color.a);
      }`;

    this.program = this.createProgram(gl, vsSource, fsSource);
    this.setupBuffers();
  }

  createProgram(gl, vsSource, fsSource) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    return program;
  }

  setupBuffers() {
    const gl = this.gl;
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1,  1,
      -1,  1,  1, -1,  1,  1,
    ]), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,  1, 0,  0, 1,
      0, 1,  1, 0,  1, 1,
    ]), gl.STATIC_DRAW);
  }

  // Función para leer y parsear el archivo .cube
  async loadCubeLUT(url) {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n');

    let size = 0;
    const data = [];

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;

      if (line.startsWith('LUT_3D_SIZE')) {
        size = parseInt(line.split(/\s+/)[1]);
      } else {
        const parts = line.split(/\s+/).map(Number);
        if (parts.length === 3 && !isNaN(parts[0])) {
          data.push(parts[0], parts[1], parts[2], 1.0); // R, G, B, A
        }
      }
    }

    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, texture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_R_WRAP_EXT, gl.CLAMP_TO_EDGE);

    gl.texImage3D(
      gl.TEXTURE_3D, 0, gl.RGBA32F,
      size, size, size,
      0, gl.RGBA, gl.FLOAT,
      new Float32Array(data)
    );

    this.currentLUTTexture = texture;
    this.render();
  }

  setImage(image) {
    const gl = this.gl;
    this.currentImage = image;
    
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    this.imageTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    this.render();
  }

  render() {
    if (!this.currentImage || !this.currentLUTTexture) return;
    const gl = this.gl;

    gl.useProgram(this.program);

    // Textura 2D de la foto
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.uniform1i(gl.getUniformLocation(this.program, "u_image"), 0);

    // Textura 3D del LUT .cube
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this.currentLUTTexture);
    gl.uniform1i(gl.getUniformLocation(this.program, "u_lut"), 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
