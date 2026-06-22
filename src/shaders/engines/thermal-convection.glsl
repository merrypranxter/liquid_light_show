// thermal-convection.glsl
// Rayleigh-Bénard thermal convection model.
//
// Buoyancy equation:
//   v_y += B * (T - T0) * dt
//
// Where:
//   T    = temperature (approximated by dye luminance)
//   T0   = ambient temperature (~0.3-0.5)
//   B    = buoyancy coefficient (heat_buoyancy parameter)
//
// Warm regions rise (v_y increases), cool regions sink.
// Combined with incompressibility (pressure projection),
// this produces convection rolls, mushroom plumes, and
// Rayleigh-Bénard cells when B is high.
//
// High B (2.0) + low viscosity = boiling_acid: rapid plume splitting,
// small convection cells, violent churning.
//
// Low B (0.5) + high viscosity = fillmore_1967: slow lazy convection,
// big blob oscillations, geological time scale.
//
// Implementation: buoyancy.frag applies this force each frame
// after advection and before the pressure solve.
//
// Reference: Chandrasekhar, S. (1961). Hydrodynamic and Hydromagnetic Stability.
//            Rayleigh-Bénard convection: Ra = g * beta * dT * L^3 / (nu * kappa)
