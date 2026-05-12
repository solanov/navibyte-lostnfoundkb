# `TC-UI-FUNC-001`

## Feature
User Interface / Responsiveness

## Scenario
Core platform features are accessible on mobile screen resolutions

## Steps
1. Open the platform in a browser and use Developer Tools to simulate a mobile device (e.g., iPhone 13 or Android equivalent), or access it via a physical mobile device.
2. Log in.
3. Navigate through the Home, Search, and Create Post pages.
4. Open the navigation menu (hamburger menu).

## Expected Result
The layout adapts seamlessly. Text is readable without zooming, images scale correctly, buttons are tappable, and no elements overlap or push off-screen.

## Actual Result
There is a UI bug: When the Archive button is clicked on the mobile view, the navigation pane below it vanishes.

## Status:
Failed

## Notes
UI Bug: The bottom navigation pane needs to remain fixed/visible when interacting with the archive elements.