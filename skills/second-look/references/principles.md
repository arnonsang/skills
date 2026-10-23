# Principles

The catalog in `donts.md` is a list of symptoms. These are the causes. Use them to judge a pattern the
catalog does not list, and to explain a finding to the user in one sentence.

## 1. Every element needs a decision behind it

Generated UI is assembled from defaults: the most common hero, the most common card, the most common
gradient. A pattern is a tell when you cannot say who chose it or why. Test: could you name the reason
this element exists and looks this way, in terms of this product and this user? If the only answer is
"landing pages have this", it is a default.

## 2. Repetition without meaning is filler

One eyebrow label is a choice; one above every section is a template. The same goes for icon tiles,
uppercase micro-labels, three-card grids and numbered markers. Test: remove the repeated element from
every place but one. If nothing is lost, the repetition was filler. Repetition is fine when it encodes a
real sequence or category (steps, slides, status).

## 3. Emphasis is a budget

Gradients, glows, motion, the primary button and the accent color all spend attention. When everything is
emphasized, nothing is. Test: list what is emphasized on the screen. There should be one main thing per
view, and the brand's signature (a gradient mark, a mascot) should appear where it does a job, not
everywhere.

## 4. Claims need evidence

Big round numbers ("10x", "99.9%", "24/7"), buzzwords and testimonials from placeholder people make claims
nobody can check. Test: can the reader verify it, or act on it? Replace with a specific figure, a unit, a
source, a real name, or a verb plus object.

## 5. Structure comes from spacing and type, not boxes

Borders around every block, cards inside cards and colored side stripes are substitutes for hierarchy.
Test: remove the boxes. If the grouping is still clear from spacing (a consistent gap scale) and type
(weight and size), the boxes were noise. If it is not clear, fix the spacing first.

## 6. Motion explains change

Motion should show where something came from, where it went, or that work is running. Bounce, idle loops
and entrance animations that hide content do none of these. Test: what change does this motion explain?
If none, remove it or make it respond to a real state.

## 7. Accessibility is the floor, not polish

Contrast, focus, reduced motion, text alternatives for charts and color never being the only signal are
not part of the taste review; they are the minimum. Text needs 4.5:1 against its background, large text
and non-text marks need 3:1, in every theme and every state (hover included). A tasteful fix that fails
these is not a fix.

## 8. The project's system wins

These principles describe defaults to avoid, not laws. When the brand has a deliberate exception (the
gradient is the logo, the product's voice uses one bold claim), keep it, mark it, and keep it to its job.
Fix with the project's tokens; a fix that adds a new raw color or font has moved the problem.

## 9. Measure, then claim

A fix is done when the probe and the contrast check say so at every width and theme, and when a new or
changed check has been shown to fire on the old version. "Looks right in one screenshot" is not evidence.
