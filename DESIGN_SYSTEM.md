# Family Finance Hub Design System

## Direction

Family Finance Hub should feel like a trusted personal finance companion, not an admin dashboard. The product language blends the calm money clarity of Monarch and Copilot, the softened chrome of Arc, and the disciplined density of Linear.

## Principles

- Lead with the household answer: who owes whom, what changed, what needs attention.
- Use cards as calm containers, not as decorative tiles.
- Keep type hierarchy strong: large money figures, compact labels, plain explanatory copy.
- Prefer whitespace and grouping over borders and table density.
- Mobile is the primary surface. Desktop expands the same mental model, it does not become an admin console.

## Tokens

- Background: warm paper with a very subtle grid, not a gradient hero.
- Foreground: deep ink for trust and legibility.
- Primary: navy ink for balance and high-confidence actions.
- Accent: coral for baby/family planning moments.
- Success: mint for cleared/shared/positive status.
- Lavender: attention and review states.
- Radius: 8px maximum for cards and controls.
- Shadows: soft, shallow elevation only. Avoid floating dashboard slabs.

## Components

- `MetricCard`: large KPI card with label, money figure, supporting detail, icon, and optional action cue.
- `InsightCard`: section-level card for finance explanations and grouped workflows.
- `SectionHeader`: plain section framing with optional action.
- `ActivityRow`: transaction or ledger row with stable spacing and tabular money.
- `StatusBadge`: small classification/status marker.
- `MiniRail`: compact proportional indicator for summary context.

## Dashboard Layout

Mobile order:

1. Month and clear household headline
2. Net position and key KPI cards
3. Shared balance formula
4. Review queue
5. Recent money movement
6. Family planning summary

Desktop keeps the same hierarchy but uses two-column compositions for explanation and context.

## Navigation

Mobile uses a bottom tab bar for Home, Cards, Review, Baby, and Scan. Secondary modules remain available in the desktop sidebar and contextual actions.

## Copy Tone

Use plain household language: “Shared balance,” “Needs review,” “Rent credits,” “Money movement.” Avoid implementation terms and accounting jargon unless the user is looking at a formula.

## Avoid

- Admin dashboard density
- Generic SaaS gradients
- Nested cards
- Tiny KPI labels with oversized empty charts
- Explaining features inside the interface
