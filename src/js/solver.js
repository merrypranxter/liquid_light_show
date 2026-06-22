// solver.js — Stam stable-fluids step order
// Orchestrates the multi-pass GPU fluid solve each frame.

export class FluidSolver {
  constructor(gl, programs, fbos, simW, simH) {
    this.gl = gl;
    this.prog = programs;
    this.fbo = fbos;
    this.simW = simW;
    this.simH = simH;
    this.quad = this._buildQuad(gl);
    this.jacobi_iters = 32;
  }

  _buildQuad(gl) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1, 1,-1, -1,1, 1,1
    ]), gl.STATIC_DRAW);
    return buf;
  }

  _drawQuad(prog) {
    const gl = this.gl;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    const loc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  _setFBO(fbo, w, h) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, w, h);
  }

  _bindTex(prog, name, unit, tex) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(prog, name), unit);
  }

  step(params, dt, mouse) {
    const gl = this.gl;
    const W = this.simW, H = this.simH;
    const dx = 1.0 / W, dy = 1.0 / H;

    // --- 1. Advect velocity ---
    this._setFBO(this.fbo.vel.write.fbo, W, H);
    const adv = this.prog.advect;
    gl.useProgram(adv);
    this._bindTex(adv, 'u_velocity', 0, this.fbo.vel.read.tex);
    this._bindTex(adv, 'u_source',   1, this.fbo.vel.read.tex);
    gl.uniform2f(gl.getUniformLocation(adv, 'u_texelSize'), dx, dy);
    gl.uniform1f(gl.getUniformLocation(adv, 'u_dt'), dt);
    gl.uniform1f(gl.getUniformLocation(adv, 'u_dissipation'), 1.0 - params.viscosity);
    this._drawQuad(adv);
    this.fbo.vel.swap();

    // --- 2. Add forces: mouse, buoyancy ---
    if (mouse.down) {
      this._addForce(mouse, params, dt);
    }
    this._addBuoyancy(params, dt);

    // --- 3. Compute divergence ---
    this._setFBO(this.fbo.div.write.fbo, W, H);
    const div = this.prog.divergence;
    gl.useProgram(div);
    this._bindTex(div, 'u_velocity', 0, this.fbo.vel.read.tex);
    gl.uniform2f(gl.getUniformLocation(div, 'u_texelSize'), dx, dy);
    this._drawQuad(div);
    this.fbo.div.swap();

    // --- 4. Clear pressure ---
    this._clearFBO(this.fbo.prs.read.fbo, W, H);
    this._clearFBO(this.fbo.prs.write.fbo, W, H);

    // --- 5. Jacobi pressure iterations ---
    for (let i = 0; i < this.jacobi_iters; i++) {
      this._setFBO(this.fbo.prs.write.fbo, W, H);
      const jac = this.prog.pressure;
      gl.useProgram(jac);
      this._bindTex(jac, 'u_pressure',   0, this.fbo.prs.read.tex);
      this._bindTex(jac, 'u_divergence', 1, this.fbo.div.read.tex);
      gl.uniform2f(gl.getUniformLocation(jac, 'u_texelSize'), dx, dy);
      this._drawQuad(jac);
      this.fbo.prs.swap();
    }

    // --- 6. Subtract pressure gradient (projection) ---
    this._setFBO(this.fbo.vel.write.fbo, W, H);
    const proj = this.prog.gradSubtract;
    gl.useProgram(proj);
    this._bindTex(proj, 'u_pressure', 0, this.fbo.prs.read.tex);
    this._bindTex(proj, 'u_velocity', 1, this.fbo.vel.read.tex);
    gl.uniform2f(gl.getUniformLocation(proj, 'u_texelSize'), dx, dy);
    this._drawQuad(proj);
    this.fbo.vel.swap();

    // --- 7. Advect dye ---
    this._setFBO(this.fbo.dye.write.fbo, W, H);
    gl.useProgram(adv);
    this._bindTex(adv, 'u_velocity', 0, this.fbo.vel.read.tex);
    this._bindTex(adv, 'u_source',   1, this.fbo.dye.read.tex);
    gl.uniform2f(gl.getUniformLocation(adv, 'u_texelSize'), dx, dy);
    gl.uniform1f(gl.getUniformLocation(adv, 'u_dt'), dt);
    gl.uniform1f(gl.getUniformLocation(adv, 'u_dissipation'), 0.995);
    this._drawQuad(adv);
    this.fbo.dye.swap();

    // --- 8. Advect phase field ---
    this._setFBO(this.fbo.phase.write.fbo, W, H);
    gl.useProgram(adv);
    this._bindTex(adv, 'u_velocity', 0, this.fbo.vel.read.tex);
    this._bindTex(adv, 'u_source',   1, this.fbo.phase.read.tex);
    gl.uniform2f(gl.getUniformLocation(adv, 'u_texelSize'), dx, dy);
    gl.uniform1f(gl.getUniformLocation(adv, 'u_dt'), dt);
    gl.uniform1f(gl.getUniformLocation(adv, 'u_dissipation'), 1.0);
    this._drawQuad(adv);
    this.fbo.phase.swap();
  }

  _addForce(mouse, params, dt) {
    const gl = this.gl;
    const W = this.simW, H = this.simH;
    this._setFBO(this.fbo.vel.write.fbo, W, H);
    const s = this.prog.splat;
    gl.useProgram(s);
    this._bindTex(s, 'u_target', 0, this.fbo.vel.read.tex);
    gl.uniform2f(gl.getUniformLocation(s, 'u_point'), mouse.x, mouse.y);
    gl.uniform3f(gl.getUniformLocation(s, 'u_value'), mouse.dx * 8000, mouse.dy * 8000, 0);
    gl.uniform1f(gl.getUniformLocation(s, 'u_radius'), 0.003);
    this._drawQuad(s);
    this.fbo.vel.swap();

    // inject dye at mouse
    this._setFBO(this.fbo.dye.write.fbo, W, H);
    gl.useProgram(s);
    this._bindTex(s, 'u_target', 0, this.fbo.dye.read.tex);
    gl.uniform2f(gl.getUniformLocation(s, 'u_point'), mouse.x, mouse.y);
    const t = performance.now() * 0.001;
    gl.uniform3f(gl.getUniformLocation(s, 'u_value'),
      0.5 + 0.5*Math.sin(t*1.3), 0.5 + 0.5*Math.sin(t*0.9+2), 0.5 + 0.5*Math.sin(t*1.7+4));
    gl.uniform1f(gl.getUniformLocation(s, 'u_radius'), 0.004 * params.dye_injection);
    this._drawQuad(s);
    this.fbo.dye.swap();
  }

  _addBuoyancy(params, dt) {
    if (params.heat_buoyancy <= 0) return;
    const gl = this.gl;
    const W = this.simW, H = this.simH;
    this._setFBO(this.fbo.vel.write.fbo, W, H);
    const b = this.prog.buoyancy;
    gl.useProgram(b);
    this._bindTex(b, 'u_velocity', 0, this.fbo.vel.read.tex);
    this._bindTex(b, 'u_dye',      1, this.fbo.dye.read.tex);
    gl.uniform1f(gl.getUniformLocation(b, 'u_buoyancy'), params.heat_buoyancy);
    gl.uniform1f(gl.getUniformLocation(b, 'u_dt'), dt);
    this._drawQuad(b);
    this.fbo.vel.swap();
  }

  _clearFBO(fbo, w, h) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
}
