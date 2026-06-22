// thin-film-color.glsl
// Thin-film optical interference → iridescent spectral color.
//
// Interference condition:
//   I(λ) = sin^2(π * 2 * n * d * cosθ / λ)
//
// Where:
//   d    = film thickness (meters, 0-1000nm range)
//   n    = refractive index (~1.45 for oil, ~1.33 for water)
//   θ    = viewing angle (~0 for flat overhead projection)
//   λ    = wavelength
//
// RGB channels evaluated at:
//   λ_R = 630nm (red)
//   λ_G = 530nm (green)
//   λ_B = 460nm (blue)
//
// d(x) is derived from the phase field:
//   d(x) = film_thickness_scale * (0.5 + 0.5 * φ(x))
//
// This means oil-rich regions (φ = -1) have d = 0 (dark)
// and water-rich regions (φ = +1) have d = film_thickness_scale.
// At intermediate values, the film thickness varies smoothly,
// producing rainbow iridescence bands.
//
// At d = 0: constructive interference for nothing (black).
// At d = 120nm: blue-green first-order iridescence.
// At d = 200nm: red-green second-order iridescence.
// At d = 400nm: full rainbow (oil-slick sweet spot).
// At d = 800nm+: higher-order, complex color patterns.
//
// Implementation: computed in projection.frag as part of the
// final compositing pass. The thinFilm() function maps thickness
// to RGB using the interference formula above.
//
// Reference: Born, M. & Wolf, E. Principles of Optics.
//            Thomas Young (1801): two-slit interference.
