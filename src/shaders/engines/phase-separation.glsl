// phase-separation.glsl
// Cahn-Hilliard phase field model for oil/water immiscibility.
//
// Equation:
//   dφ/dt = -M * nabla^2 (f'(φ) - epsilon * nabla^2 φ)
//
// Where:
//   φ ∈ [-1, +1]  phase field (-1 = oil, +1 = water)
//   f(φ) = 0.25 * (φ^2 - 1)^2  double-well free energy
//   f'(φ) = φ^3 - φ            chemical potential
//   M       mobility (how fast phases separate, ~0.001-0.01)
//   epsilon  interface width / surface tension parameter
//
// The double-well drives φ toward +/-1 (pure oil or pure water).
// The Laplacian term penalizes sharp interfaces — produces smooth blobs.
//
// In practice: the phase field is seeded with noise, then evolved.
// It gets *advected* by the velocity field each frame (solver.js),
// and *evolved* by a Cahn-Hilliard pass that computes the chemical
// potential and applies the diffusion.
//
// The phase field drives:
//   1. Film thickness d(x) = film_thickness_scale * (0.5 + 0.5 * φ)
//      which feeds the thin-film iridescence calculation.
//   2. Surface tension forces (optional: add φ gradient force to velocity).
//
// Reference: Cahn, J. & Hilliard, J. (1958). Free energy of a nonuniform system.
