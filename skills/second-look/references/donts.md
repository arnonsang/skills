# The Don'ts catalog

Each entry gives the pattern, why it reads as machine-made, what to do instead, and how to check it.
`lint: <rule>` means `scripts/second-look-lint.js` measures it in the browser; `review` means a person
(or you, reading the page) has to judge it.

Token names below are roles (`text`, `accent`, `surface`, `border-subtle`, `gap-stack-*`). Map them to
the project's own names before you write the fix; never invent new raw hex values to fix a finding.

Contents: Visual, Layout, Type, Motion, Copy, Components, Data, and how to write the project's own list.

## Visual

| Don't | Why it reads as generated | Do instead | Check |
|---|---|---|---|
| Gradient text (`background-clip: text` on a gradient) | The single most common default in generated landing pages; also hurts contrast at one end of the ramp | Solid `text` or `accent-text`; emphasis through weight or size | lint: gradient-text |
| Gradients as decoration: section backgrounds, icon tiles, card images, dividers, borders | Gradients everywhere flatten hierarchy; nothing is special when everything shimmers | Solid surfaces. If the brand has a gradient, keep it to the logo, one hero CTA and its own demos | lint: decorative-gradient |
| Glow blobs, neon glows, colored light behind content | Ambient "aurora" is a template signature and costs paint time | Flat `bg`; depth from the shadow scale | review |
| Colored side-stripe borders on cards, alerts, list items | Default "callout" look in generated UI; a thick left border carries meaning no one defined | Full outline, a soft tint of the status color, or a leading icon | lint: side-stripe |
| A gradient behind a transparent border (the 1px "glow ring") | Usually a bug: the gradient repeats inside the border box and shows a seam or stripe | `background-origin: border-box` plus `background-clip: border-box`, or a solid border | lint: gradient-border |
| Glass and blur as the default surface | Frosted cards on a blurred gradient is the stock "modern" look and fails contrast over busy backgrounds | Solid `surface` and `surface-2`; blur only on a modal scrim | review |

## Layout

| Don't | Why | Do instead | Check |
|---|---|---|---|
| An eyebrow or numbered marker (01, 02, 03) above every section | Repeated kickers are filler that pretends to be structure | The heading alone; group sections in navigation. Numbers only for a real sequence (steps, timelines, slides) | lint: eyebrow-repeat |
| An icon tile above or beside every heading | Decorative icons repeat the heading's meaning and turn every section into the same card | Icons in navigation, buttons and status; headings stay text | lint: heading-icon-repeat |
| The hero-metric row: big numbers, small labels, side by side ("10x faster, 99.9% uptime, 24/7") | Numbers without a source or comparison read as invented | A sentence with the figures and a link to the source; one stat with comparison and source where the number is the point | review |
| Identical card grids (icon + heading + text, repeated three or six times) | The default "features" section; cards that are not objects you open | A list or a table. Cards only when each card is a thing you open or act on | review |
| Cards inside cards; a border around every block | Boxes as a substitute for spacing and hierarchy | Spacing from the gap scale and subtle dividers between groups | review |
| Containers whose children touch, or siblings spaced with margins | Generated code mixes margins and missing gaps, so rhythm drifts | A `gap-*` token on every flex or grid parent; no margins between siblings | lint: gap |
| Everything centered, every section the same width and height | Uniform rhythm signals no editorial decision | Left-aligned reading text; vary section density by content | review |

## Type

| Don't | Why | Do instead | Check |
|---|---|---|---|
| Tiny uppercase tracked labels repeated across the page | A stock way to fake hierarchy | Sentence case with the label or caption style; hierarchy through weight and size | lint: uppercase-repeat |
| Display type above about 96px, or tracking tighter than -0.04em | Oversized tight display is a template tell and breaks on small screens | A fluid display size with a sane max, and the tracking from the type tokens | review |
| New font families picked by reflex (the usual geometric sans plus a serif accent) | A font nobody chose is a font that came from the model's defaults | The project's families. If there are none, choose one with a reason you can state | review |

## Motion

| Don't | Why | Do instead | Check |
|---|---|---|---|
| Bounce, elastic or overshoot easing | Cartoon physics on business UI reads as a demo, not a product | Ease-out to enter, ease-in to leave, a critically damped spring to move | lint: bounce |
| Animating width, height, top, left, margin or padding | Layout thrash and jank | `transform` and `opacity`; snap layout changes | lint: layout-transition |
| Content hidden until a scroll or entrance animation runs | Breaks with JS off, in print, in screenshots and for reduced motion | Content visible by default; animation only enhances it | review |
| Loops that keep moving when nothing is happening | Ambient motion with no meaning drains attention and battery | Loops only while work runs (`aria-busy`, a working state) and never under reduced motion | lint: infinite-loop (info) |

## Copy

| Don't | Why | Do instead | Check |
|---|---|---|---|
| Buzzwords: seamless, supercharge, unleash, next-gen, cutting-edge, game-changer, elevate, effortless | The vocabulary of generated marketing; says nothing a reader can verify | A specific verb and a real number | lint: copy |
| Em dashes in UI copy | Heavy em dash use is a well-known generated-text tell | Commas, colons or full stops | lint: copy |
| Placeholder people, companies and round numbers (John Doe, Jane Smith, Acme, Lorem ipsum, 99.9%) | Sample data nobody replaced | Realistic names for the product's audience; organic figures with units | lint: placeholder |
| Vague buttons and links (OK, Submit, Click here, Learn more) | No object, so the user has to read around the button | Verb plus object: "Approve and post", "View receipt" | review |
| A section intro that repeats its heading | Filler | Say the one thing the heading does not | review |

## Components

| Don't | Why | Do instead | Check |
|---|---|---|---|
| More than one primary button in a view | Competing calls to action | One primary; the rest default, ghost or danger | review |
| A modal as the first choice | Interrupts flow for things that could be inline | Inline editing, a drawer or progressive disclosure; dialogs confirm destructive actions | review |
| Emoji as icons, or mixed icon sets | Inconsistent stroke and metaphor | One icon set, one stroke width, sizes from tokens | review |
| Color as the only signal | Fails color-blind users and grayscale print | Icon plus word for every status; patterns or labels in charts | review |
| A hover state that changes the background but not the text color | Text can vanish on hover (dark on dark) | Set both `color` and `background` in every state; probe with `--hover` | probe --hover |

## Data

| Don't | Why | Do instead | Check |
|---|---|---|---|
| Status colors (success, warning, danger) used as chart series | Readers think a series is "bad" because it is red | A categorical palette in fixed order; status colors only for state, with icon and label | review |
| Dual axes, pies with more than five slices, rainbow scales | Hard to read, easy to mislead | One axis, sorted bars, a sequential ramp for magnitude, a diverging ramp for change | review |
| A chart with no table or text alternative | Inaccessible and unverifiable | A data table (visible or toggled) and a one-line takeaway | review |

## Writing the project's own list

When you encode the Don'ts into a project, keep the same three columns: the pattern, what to do
instead, how it is checked. Use the project's token names in "do instead", and add a line that tells
agents to run the lint before calling UI done. Put it where agents read first: `AGENTS.md`,
`CLAUDE.md`, `DESIGN.md`, or a Don'ts section in the design system page itself. Mark demo regions that
show a pattern on purpose with `data-second-look-demo` so the lint skips them.
