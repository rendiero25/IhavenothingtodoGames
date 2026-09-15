# Little Courier Map Expansion Design

## Goal

Expand Little Courier from a 136 by 136 world to 176 by 176 so later deliveries use longer routes through additional city blocks.

## Design

- Set navigation bounds to `-88..88` on both axes.
- Add a connected outer road ring, parallel sidewalks, and twelve sparse outer-block buildings.
- Keep six residents and five deliveries; place three resident stops in the new outer district so every delivery remains connected and later routes become materially longer.
- Keep deadlines derived from route distance and preserve their strictly decreasing order.
- Render outer blocks with the existing low-detail building branch. Do not add actors, textures, dependencies, accounts, or persistence.
- Preserve the current batched Rapier update and keep the scene below its existing mesh and triangle budgets.

## Verification

- Tests prove exact bounds, outer-road connectivity, outer resident placement, longer delivery distance, collision safety, and render budgets.
- Run all repository tests, production build, `git diff --check`, and `git status -sb`.
