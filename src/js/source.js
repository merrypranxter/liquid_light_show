// source.js — handles u_source input: image upload, webcam, or upstream FBO
export class Source {
  constructor(gl) {
    this.gl = gl;
    this.tex = null;
    this.active = false;
  }

  fromImage(file) {
    const gl = this.gl;
    const img = new Image();
    img.onload = () => {
      if (!this.tex) this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.active = true;
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  fromWebcam() {
    // TODO: getUserMedia → video → texture update in render loop
  }

  bind(unit) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    if (this.active && this.tex) {
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
    } else {
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }
}
