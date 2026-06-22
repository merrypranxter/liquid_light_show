// stable-fluids.glsl
// Stam stable-fluids conceptual reference.
// Pipeline: advect velocity → diffuse → pressure-project → advect dye
// Each pass is a separate .frag shader called by the solver.
//
// Step 1: advect.frag  — semi-Lagrangian backtrace for velocity
//   v_new(x) = v_old(x - v_old(x)*dt)
//
// Step 2: divergence.frag — compute curl/divergence of velocity field
//   div = 0.5 * (dVx/dx + dVy/dy)
//
// Step 3: pressure.frag (x N Jacobi iterations)
//   p_new = (L + R + B + T - divergence) / 4
//
// Step 4: grad_subtract.frag — subtract pressure gradient
//   v_projected = v - nabla(p)
//   This enforces incompressibility: div(v) = 0
//
// Step 5: advect.frag for dye
//   c_new(x) = c_old(x - v*dt)
//
// Boundary conditions: clamp to edge (free-slip)
//
// Reference: Stam, J. (1999). Stable Fluids. SIGGRAPH 99.
//            Bridson, R. (2015). Fluid Simulation for Computer Graphics.
