# Visual Targets

## Aesthetic Regimes

### fillmore_1967
Slow churning blobs of magenta, cyan, and amber over deep violet-black. High viscosity (0.02), low heat (0.5), heavy bloom (0.6), soft defocus (0.3). Big lazy forms that merge and split like slow-moving planets. The palette is warm and theatrical. Jefferson Airplane is playing. Reference: Gut Buchwald, the Joshua Light Show, 1967 Fillmore West.

**Target feel:** Hypnotic, slow, oceanic. Forms feel *geological* in their pace.

### boiling_acid
High heat (2.0), very low viscosity (0.001), low surface tension (0.1). Fast convection cells splitting and merging. Electric green, hot magenta, cyan, red. The plumes are violent. The cells are small and angry. Reference: boiling sulfuric acid baths, electron microscopy of cell division.

**Target feel:** Urgent, fractal, threatening-and-beautiful.

### oil_slick
Thin-film dominant. Near-black background. Phase field drives film thickness variation. Rainbow dichroic sheen. `film_thickness_scale = 800nm`. Defocus 0.2. Very little dye injection (0.1). The color comes entirely from interference, not pigment. Reference: parking lot after rain, soap bubble spectrum.

**Target feel:** Silent, iridescent, hypnotic. Color feels *structural*, not painted.

### ink_in_water
Pure dye diffusion. No heat (`heat_buoyancy = 0.0`). Medium viscosity (0.05). Slow graceful plumes. Deep palette: hot pink, cyan, amber on black. Reference: Suminagashi marbling, Japanese ink in water photography.

**Target feel:** Meditative, precise, beautiful.

## Output Checklist

- [x] Engine 1 (stable_fluids) renders correctly
- [x] Engine 2 (phase_separation) renders correctly
- [x] Engine 3 (thermal_convection) renders correctly
- [x] Engine 4 (thin_film_color) renders correctly
- [x] Post-finisher (projection.frag) applies
- [x] Parameters are interactive in real-time
- [x] Regime presets load correctly
- [x] Image source upload works
- [x] Click+drag force injection works
