// fbo-pingpong.js — Read A, Write B, Swap. The feedback engine.
export class FBOPingPong {
  constructor(gl, w, h, internalFormat, format, type) {
    this.gl = gl;
    this.w = w; this.h = h;
    this.read  = this._makeFBO(gl, w, h, internalFormat, format, type);
    this.write = this._makeFBO(gl, w, h, internalFormat, format, type);
  }

  _makeFBO(gl, w, h, internalFormat, format, type) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex };
  }

  swap() { [this.read, this.write] = [this.write, this.read]; }
}
