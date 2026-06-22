# liquid_light_show

A creative coding project exploring **1960s oil-projector psychedelia** — colored oil and water and dye between hot clockglasses on an overhead projector, projected through as immiscible fluids boil, blob, and swirl. Wet, organic, breathing color. A full fluid solver. The big one.

## What Is This?

A **generator** that simulates a real fluid solver (Stam stable-fluids) with phase separation (Cahn-Hilliard), thermal convection (Rayleigh-Bénard), and thin-film iridescence. The result is the look of a 1960s liquid light show: oil and water projected through, the colors breathing and merging and splitting, the light wet and alive.

**Bonus:** Can project a `u_source` image through the simulated liquid medium via the upload button.

## Project Structure

```
src/
  js/
    main.js           — WebGL2 setup, render loop, parameter UI
    fbo-pingpong.js   — velocity / dye / phase / pressure FBOs
    solver.js         — Stam stable-fluids step order
    color-maps.js     — palette ramps + regime presets
    source.js         — u_source image upload handler
  shaders/
    engines/          — conceptual docs for each medium model
      stable-fluids.glsl
      phase-separation.glsl
      thermal-convection.glsl
      thin-film-color.glsl
    advect.frag       — semi-Lagrangian velocity + dye advection
    pressure.frag     — Jacobi pressure iteration
    divergence.frag   — velocity divergence
    grad_subtract.frag — pressure gradient subtraction (projection)
    splat.frag        — gaussian force/dye injection
    buoyancy.frag     — Rayleigh-Bénard thermal force
    dye.frag          — dye diffusion pass
    projection.frag   — backlit additive color + thin-film + bloom
docs/
  math-reference.md
  visual-targets.md
```

## Running

Open `index.html` in any modern browser. **WebGL2 required.** Must be served over HTTP (not file://):

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Medium Engines

- [x] **stable_fluids** — Stam solver: advect → diffuse → pressure-project (Jacobi, incompressible) → advect dye
- [x] **phase_separation** — Cahn-Hilliard keeps oil & water as distinct blobby domains
- [x] **thermal_convection** — Rayleigh-Bénard buoyancy plumes
- [x] **thin_film_color** — film thickness → spectral iridescence (dichroic sheen)

## Aesthetic Regimes

| Regime | Mood | Key Parameters |
|---|---|---|
| **fillmore_1967** | Slow, oceanic, hypnotic | viscosity=0.02, buoyancy=0.5, heavy bloom |
| **boiling_acid** | Violent, electric, fractal | viscosity=0.001, buoyancy=2.0, fast cells |
| **oil_slick** | Silent, iridescent, structural | film=800nm, thin-film dominant |
| **ink_in_water** | Meditative, elegant plumes | buoyancy=0, pure dye diffusion |

## Parameters

| Parameter | Range | Description |
|---|---|---|
| `viscosity` | 0.0–0.1 | Fluid thickness / dye dissipation |
| `heat_buoyancy` | 0.0–2.0 | Thermal plume strength |
| `surface_tension` | 0.0–1.0 | Phase separation + iridescence strength |
| `dye_injection` | 0.0–1.0 | Color injection radius |
| `film_thickness_scale` | 0–1000 nm | Thin-film color range |
| `defocus` | 0.0–1.0 | Projected light softness |

## Interaction

- **Click + drag** on the canvas to inject dye and forces
- Auto-sources continuously inject dye from wandering points
- Upload an image to project it through the fluid

## Ecosystem Hooks

Consumes `thin_film_iridescence` + `structural_color`. Shares fluid engine with `fluid_dynamics`, `klein-fluid-sim`, `ferrofluid_dance`. Pairs with `psychedelic_collage`, `vintage_blacklight_poster_style`, `shoegaze_style`.

---

*The light is wet. The color is alive. The oil remembers the heat.*
