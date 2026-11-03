# M.Y.M.P. personal money planner

This revision replaces the previous neutral folio styling. The audience is a
person checking what they can spend today, recording money, and separating cash,
bank, wallet, and savings balances on a phone.

## Design system

- Paper: #edf1f0; sheet: #fffefa; ink: #183b40; petrol: #234f50;
  mint: #dce9df; annotation yellow: #eedda3.
- Instrument Sans for headings, controls, and figures. Instrument Serif italic
  is reserved for the planner title and large financial figures. DM Sans remains
  available for supporting legacy components. All fonts are bundled locally.
- Balance cover and daily pocket are separate components. A monthly cash-flow
  strip sits under the cover. Wallet dividers carry individual account balances.
- Signature: the daily pocket uses a clipped receipt edge, a meaningful calendar
  stamp, and a formula strip. It makes allowance periods visible through the
  form of a physical planner, without decorative numbering or fake statistics.

```
Desktop                         Phone
planner title / date            planner title / date
balance cover | daily pocket    balance cover
monthly flow  | daily pocket    monthly flow
account wallet dividers         daily pocket
money journal | upcoming       account wallet dividers
```

## Critique before implementation

The previous small serif headings, white panels, and thin rules looked too
similar to the prior version. This revision changes the composition, contrast,
typeface, card construction, and navigation treatment together. The petrol cover
and receipt pocket provide the identity; charts, lists, and forms use quieter
surfaces so the app remains useful for real transactions. Theme accents and dark
mode must continue to work, and calculations and saved data are not changed.
