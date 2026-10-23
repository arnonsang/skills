# Slides and infographics

Read this when the work is a deck, a one-pager, a report or a chart page. These formats share the
product's tokens; they do not get their own palette or fonts.

## Slides

**What makes a deck look generated:** every slide is a centered title over three icon cards; a
gradient background on every slide; stock "abstract tech" imagery; a hero-metric row on the
title slide; bullet lists of five fragments; the same layout from start to end.

**Do instead:**

- A small set of layouts chosen per slide's job: title, agenda, section break, statement (one
  sentence), split (text plus image), data (one chart, one takeaway as the title), big number (with
  comparison and source), compare (two columns), table, quote, timeline, product shot, closing.
  Mix them; no two adjacent slides share a layout unless they are a sequence.
- The title states the takeaway ("Refunds fell 18% after the new flow"), not the topic ("Refunds").
- Size type in container units (`cqw`) inside a fixed 16:9 frame so it scales with the slide, not
  the window. Keep a five-step scale (for example 4.6, 3.2, 1.6, 1.2 cqw and a 5 cqw padding) as
  tokens.
- Background variety from brand shapes, not gradients: a solid color slide, an ink (dark) style, a
  dot grid or a large crop of the logo mark as a motif. Offer two or three deck styles via one
  attribute (for example `data-style="clean|bold|ink"`) and check contrast for each.
- Images: real product screenshots or the brand's own illustrations, with alt text. An image block
  needs a caption or a role in the argument.
- Numbering is fine here: slides are a real sequence.
- Presenter needs: keyboard navigation, a slide counter, print to PDF with one slide per page
  (`@page { size: 16in 9in }`, `break-after: page`).

## Infographics and charts

**What makes them look generated:** rainbow palettes, status red and green as series, 3D or
gradient-filled bars, donuts with eight slices, numbers with no source, decorative icons next to
every figure, legends far from the data.

**Do instead:**

- One categorical palette of at most five slots, in fixed order, validated for color-vision
  deficiency and contrast against the chart background in both themes. Above five series, group the
  tail as "Other" or use small multiples.
- A sequential ramp (one hue, light to dark) for magnitude and a diverging ramp (two hues around a
  neutral) for change. Never a rainbow.
- Status colors stay for state: an alert, a threshold line. Not a series.
- Label the data directly (end of line, inside or beside the bar) instead of a distant legend.
- Every chart has a one-line takeaway title, a source line, and a table alternative (visible, or a
  toggle). Tooltips must also work with keyboard focus.
- Sorted bars beat pies. A funnel's stage labels belong inside the drawing so they stay aligned at
  every width.
- Check: run `scripts/contrast.py` on each series color against the background (3:1 for marks, 4.5
  for any text on them) in light and dark.
