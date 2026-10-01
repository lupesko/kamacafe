# Application Contract

## Public addresses

| View | Address | Required behavior |
|---|---|---|
| Home | `/` | Render every catalog category in catalog order. Empty `#` is equivalent. |
| Category | `/#category-{category.id}` | Render the matching category and only its drinks, preserving catalog order. |
| Drink | `/#{drink.id}` | Render the matching drink with a complete resolved recipe. |
| Unavailable | Any unrecognized non-empty hash | Explain that the page is unavailable and expose a link to `/`. |

IDs are inserted verbatim after validation against the lowercase slug grammar.
Names, ordering, and counts are never route inputs and may change without
changing an existing address.

## Navigation behavior

- Category and drink cards are anchors with the designated `href`.
- Category back links target `/`; drink back links target their category hash.
- Initial load, refresh, anchor activation, and `hashchange` all use the same
  route parser.
- Browser Back and Forward change both the hash and rendered view.
- Each completed view transition moves document scroll to the top without
  stealing focus from a user who is already interacting.
- Unknown or retired IDs never fall back to another entity.

## View content

### Home

- Shared header: coffee bean mark and “KamaCafé - Brew the perfect cup”.
- Heading: “What are we brewing?” and the specified supporting line.
- One full-card link per category with catalog name and description.

### Category

- Back link labelled “← Coffee styles”.
- Category name without a redundant drink count.
- One drink link per matching catalog drink with image, name, formatted
  preparation time, and difficulty level.

### Drink

- Back link labelled with its category name.
- Hero with recipe label, drink name, header, image, time, difficulty and reason,
  serving size or current batch yield, and caffeine range/note.
- “What you need” shows every resolved ingredient and inherited setting with
  explicit units. Grind guidance shows its qualitative label and an approximate
  particle-size range in µm, prefixed with `~`.
- Recipes explicitly marked scalable show a coffee-to-water ratio. Minus/plus
  buttons change servings. Ingredient quantities, water guidance, and
  quantity-bearing steps update together.
- Fixed recipes, including Espresso and all inherited espresso drinks, omit the
  ratio/scaler and show the catalog serving size unchanged.
- Temperatures, grind, ratio, caffeine per serving, and batch equipment marked
  as non-scaling remain unchanged. Scaling resets when a different drink opens.
- “How to make it” is an ordered list of every resolved step.
- Failure to load decorative imagery does not remove or cover any text.

## Accessibility and responsive behavior

- Use one `h1` per view and a logical heading sequence.
- Use anchors for navigation, an ordered list for steps, and text labels for all
  facts; color and images do not carry unique meaning.
- Interactive targets are at least 44 by 44 CSS pixels and have visible focus.
- Recipe scaling uses native buttons and live output, and does not require
  pointer or hover interaction.
- Content has no horizontal document overflow from 320 through 1440 px.
- Sentence-length recipe guidance uses a full-width stacked label/value row;
  its label and value do not overlap, clip, or obscure each other from 320
  through 1440 px. Compact quantities may retain two-column alignment.
- Touch and keyboard behavior do not depend on hover.
- Motion honors `prefers-reduced-motion`.
- Images inside fully labelled drink links are decorative (`alt=""`); the bean
  mark is decorative next to the visible product name.
- Cocoa token combinations meet WCAG 2.2 AA contrast for their text sizes.

## Browser verification matrix

| Priority | Automated project | Release expectation |
|---|---|---|
| Primary mobile | Mobile Safari / WebKit | Current and previous two major iOS Safari releases |
| Primary mobile | Mobile Chrome / Chromium | Current Android Chrome |
| Primary desktop | Branded Chrome where available | Latest stable Chrome |
| Primary desktop | Desktop WebKit plus manual Safari | Latest stable Safari |

Playwright emulation is necessary but does not replace the manual current-Safari
keyboard and VoiceOver release check.
