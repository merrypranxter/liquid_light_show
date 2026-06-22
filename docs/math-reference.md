# Math Reference

## Core Equations

### Stam Stable-Fluids

Velocity advection (semi-Lagrangian backtrace):
```
v_new(x) = v_old(x - v_old(x)·dt)
```
Traces each cell backward along the velocity field, samples the old value there. Unconditionally stable at any dt.

Pressure Poisson (Jacobi iteration):
```
∇²p = ∇·v
p_new = (p_L + p_R + p_U + p_D - divergence·dx²) / 4
```
Iterate 20–40 times. Convergence is approximate but visually sufficient.

Projection (subtract gradient to enforce incompressibility):
```
v_projected = v - ∇p
```
Forces `∇·v = 0`. This is what makes the fluid feel like fluid.

### Cahn-Hilliard Phase Separation
```
∂φ/∂t = -M·∇²(φ³ - φ - ε·∇²φ)
```
- `φ ∈ [-1, +1]`: phase field (-1 = oil, +1 = water)
- `M`: mobility (how fast phases separate)
- `ε`: interface width / surface tension

The double-well potential `φ³ - φ` drives the field toward ±1 (pure phases). The `ε·∇²φ` term penalizes sharp interfaces, producing smooth blob boundaries.

### Rayleigh-Bénard Buoyancy
```
v_y += B·(T - T₀)·dt
```
- `B`: buoyancy coefficient (`heat_buoyancy` parameter)
- `T`: temperature field (approximated from dye luminance)
- `T₀`: ambient temperature (0.3)

Warm regions rise, cool regions sink. Combined with the pressure solver, this produces convection rolls and plumes.

### Thin-Film Iridescence
```
I(λ) = sin²(π · 2·n·d·cosθ / λ)
```
- `d`: film thickness (derived from phase field)
- `n`: refractive index (~1.45 for oil)
- `θ`: viewing angle (≈0 for flat projection)
- `λ`: wavelength (sampled at R=630nm, G=530nm, B=460nm)

Evaluated at R/G/B wavelengths to produce iridescent color.

### Backlit Projection
```
final = palette(density) + iridescence·surfaceTension + backlight·ambient + bloom
```
- `backlight`: warm white (1.0, 0.96, 0.88)
- `density`: dye luminance (drives palette lookup)
- `bloom`: bright regions glow (quadratic power of luminance above threshold)

## Shader Snippets

### Semi-Lagrangian Advection
```glsl
vec2 vel = texture(u_velocity, uv).xy;
vec2 prevPos = uv - vel * dt * texelSize * texSize;
prevPos = clamp(prevPos, texelSize, 1.0 - texelSize);
vec4 result = texture(u_source, prevPos);
```

### Jacobi Pressure Iteration
```glsl
float L = texture(u_pressure, uv - vec2(dx,0)).x;
float R = texture(u_pressure, uv + vec2(dx,0)).x;
float B = texture(u_pressure, uv - vec2(0,dy)).x;
float T = texture(u_pressure, uv + vec2(0,dy)).x;
float div = texture(u_divergence, uv).x;
float p = (L + R + B + T - div) * 0.25;
```

### Thin-Film Color
```glsl
float d = film_thickness * (0.5 + 0.5 * phase); // thickness from phase field
float path = 2.0 * 1.45 * d;                    // optical path difference
float r = pow(sin(PI * path / 630e-9), 2.0);    // R channel
float g = pow(sin(PI * path / 530e-9), 2.0);    // G channel
float b = pow(sin(PI * path / 460e-9), 2.0);    // B channel
```

## References

- **Stam, J.** (1999). “Stable Fluids.” SIGGRAPH 99.
- **Bridson, R.** (2015). *Fluid Simulation for Computer Graphics*, 2nd ed.
- **Cahn, J., Hilliard, J.** (1958). “Free energy of a nonuniform system.” J. Chem. Phys.
- **Born, M., Wolf, E.** *Principles of Optics* — thin-film interference.
- Joshua Light Show — 1967 Fillmore West projection technique.
