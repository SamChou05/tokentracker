/**
 * ASCII art part library for creature rendering.
 *
 * Design principles:
 * - Use Unicode box-drawing and block chars for richer visuals
 * - Each body type has size variants
 * - Parts are arrays of strings (lines) for easy composition
 * - {P} = primary color, {S} = secondary color, {E} = eye color, {A} = aura color, {R} = reset
 */

// ─── EGG ───────────────────────────────────────────────

export const EGG = [
  '         ',
  '    ╭─╮  ',
  '   ╭┤ ├╮ ',
  '   │╰─╯│ ',
  '   │ ◊ │ ',
  '   ╰───╯ ',
  '    ╰─╯  ',
  '         ',
];

export const EGG_CRACKING = [
  '      ⁂  ',
  '    ╭─╮  ',
  '   ╭┤∗├╮ ',
  '   │╰⚡╯│',
  '   │ ◊ │ ',
  '   ╰─⚡─╯',
  '    ╰─╯  ',
  '         ',
];

// ─── BLOB (Level 1-2) ─────────────────────────────────

export const BLOB_SMALL = [
  '          ',
  '   ╭───╮  ',
  '   │{E}◉ ◉{R}│  ',
  '   │ {S}▽{R} │  ',
  '   ╰─┬─╯  ',
  '    ╰┘    ',
];

export const BLOB_MEDIUM = [
  '            ',
  '   ╭─────╮  ',
  '   │{E} ◉ ◉ {R}│  ',
  '   │  {S}▽{R}  │  ',
  '   │  {P}◇{R}  │  ',
  '   ╰──┬──╯  ',
  '     ╰┘    ',
];

// ─── SPRITE (Level 3-4) ───────────────────────────────

export const SPRITE_SMALL = [
  '     {S}△{R}      ',
  '   ╭─┴─╮   ',
  '   │{E}◈  ◈{R}│   ',
  '   │ {S}◡{R} │   ',
  '   ╰┬──┬╯   ',
  '    │  │   ',
  '    ╰┘╰┘   ',
];

export const SPRITE_MEDIUM = [
  '      {S}△{R}       ',
  '    ╭─┴──╮   ',
  '   {A}✦{R}│{E} ◈  ◈ {R}│{A}✦{R}  ',
  '    │  {S}◡{R}  │   ',
  '    │ {P}◆◆{R} │   ',
  '    ╰┬───┬╯   ',
  '     │   │   ',
  '     ╰┘ ╰┘   ',
];

// ─── SERPENT (Level 5-6) ──────────────────────────────

export const SERPENT_MEDIUM = [
  '    {S}╱▲╲{R}         ',
  '   ╭┴──┴╮       ',
  '  {A}░{R}│{E} ◉  ◉ {R}│{A}░{R}     ',
  '   │ {S}═══{R} │       ',
  '   │ {P}▓▓▓{R} │       ',
  '   ╰┬────╯╲      ',
  '    │  ╭───╯     ',
  '    ╰──╯  {S}~{R}      ',
];

export const SERPENT_LARGE = [
  '     {S}╱▲▲╲{R}          ',
  '   ╭─┴──┴─╮       ',
  '  {A}░░{R}│{E}  ⊛  ⊛  {R}│{A}░░{R}    ',
  '   │  {S}════{R}  │       ',
  '   │ {P}▓▓▓▓▓{R} │       ',
  '   │ {P}▓▓▓▓▓{R} │       ',
  '   ╰┬──────╯╲     ',
  '    │   ╭────╯    ',
  '    │   │  {S}≈≈{R}     ',
  '    ╰───╯         ',
];

// ─── DRAGON (Level 7-9) ──────────────────────────────

export const DRAGON_MEDIUM = [
  '       {S}╱▲▲╲{R}          ',
  '     ╭─┴──┴─╮       ',
  '  {A}▓░{R} │{E}  ⊛  ⊛  {R}│ {A}░▓{R}  ',
  ' {S}╱╲{R} │  {S}╤══╤{R}  │ {S}╱╲{R}  ',
  ' {S}╲╱{R} │ {P}▓▓▓▓▓▓{R} │ {S}╲╱{R}  ',
  '     │ {P}▓▓▓▓▓▓{R} │     ',
  '     ╰┬──────┬╯     ',
  '      │      │      ',
  '      ╰┘    ╰┘  {S}⚡{R}  ',
];

export const DRAGON_LARGE = [
  '        {S}╱▲▲▲╲{R}             ',
  '      ╭─┴───┴─╮          ',
  '   {A}▓▓░{R}│{E}  ⊛    ⊛  {R}│{A}░▓▓{R}    ',
  '  {S}╱╲╱╲{R}│  {S}╤════╤{R}  │{S}╱╲╱╲{R}   ',
  '  {S}╲╱╲╱{R}│ {P}▓▓▓▓▓▓▓▓{R} │{S}╲╱╲╱{R}   ',
  '      │ {P}▓▓▓▓▓▓▓▓{R} │        ',
  '      │ {P}▓▓▓▓▓▓▓▓{R} │        ',
  '      ╰┬────────┬╯        ',
  '       │        │         ',
  '       ╰┘      ╰┘   {S}⚡⚡{R}  ',
];

// ─── PHOENIX (Level 10+) ─────────────────────────────

export const PHOENIX_LARGE = [
  '          {A}✶{R}              ',
  '       {A}✦{R} {S}╱▲▲▲╲{R} {A}✦{R}         ',
  '      ╭──┴───┴──╮       ',
  '  {A}✧▓▓░{R}│{E}  ✦    ✦  {R}│{A}░▓▓✧{R}  ',
  ' {S}╱╲╱╲╱{R}│  {S}╤════╤{R}  │{S}╱╲╱╲╱{R} ',
  ' {S}╲╱╲╱╲{R}│ {P}▓▓▓▓▓▓▓▓{R} │{S}╲╱╲╱╲{R} ',
  '  {A}~*~{R}  │ {P}▓▓▓▓▓▓▓▓{R} │ {A}~*~{R}  ',
  '       │ {P}▓▓▓▓▓▓▓▓{R} │       ',
  '       ╰┬────────┬╯       ',
  '     {A}⚡{R}  │        │  {A}⚡{R}    ',
  '        ╰┘      ╰┘       ',
  '      {A}✦  ✧  ✶  ✧  ✦{R}     ',
];

/** Map of body type → size → art template */
export const BODY_ART: Record<string, Record<string, string[]>> = {
  egg:     { egg: EGG, small: EGG_CRACKING },
  blob:    { small: BLOB_SMALL, medium: BLOB_MEDIUM, large: BLOB_MEDIUM },
  sprite:  { small: SPRITE_SMALL, medium: SPRITE_MEDIUM, large: SPRITE_MEDIUM },
  serpent: { small: SERPENT_MEDIUM, medium: SERPENT_MEDIUM, large: SERPENT_LARGE },
  dragon:  { small: DRAGON_MEDIUM, medium: DRAGON_MEDIUM, large: DRAGON_LARGE },
  phoenix: { small: PHOENIX_LARGE, medium: PHOENIX_LARGE, large: PHOENIX_LARGE },
};
