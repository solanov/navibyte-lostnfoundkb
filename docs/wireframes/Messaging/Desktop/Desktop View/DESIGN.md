---
name: Modern Messaging System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#424656'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#727687'
  outline-variant: '#c2c6d8'
  surface-tint: '#0054d6'
  primary: '#0050cb'
  on-primary: '#ffffff'
  primary-container: '#0066ff'
  on-primary-container: '#f8f7ff'
  inverse-primary: '#b3c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#a33200'
  on-tertiary: '#ffffff'
  tertiary-container: '#cc4204'
  on-tertiary-container: '#fff6f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#832600'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  gutter: 1rem
  margin: 1.5rem
---

## Brand & Style

This design system is built on the principles of **Minimalism** and **Corporate Modern** aesthetics. The core objective is to reduce cognitive load, allowing communication to take the spotlight. By prioritizing functional clarity and high-quality whitespace, the interface recedes to let user content drive the experience.

The brand personality is efficient, transparent, and dependable. It avoids unnecessary ornamentation in favor of precise alignment and purposeful motion. This approach fosters a sense of speed and reliability, essential for a modern communication platform.

## Colors

The palette is centered around a high-energy "Action Blue" used exclusively for interactive elements and primary brand touchpoints. The interface is constructed using a sophisticated scale of cool grays. 

- **Primary Blue:** Reserved for calls to action, active states, and unread indicators.
- **Surface Grays:** Used to define hierarchical zones, such as sidebar navigation or message bubble backgrounds.
- **Whitespace:** Utilized as a structural element to separate conversations and prevent visual clutter.

## Typography

This design system utilizes **Inter** for its systematic, utilitarian nature. It is chosen for its exceptional legibility at small sizes and its neutral character, which ensures that the tone of a message is determined by the sender, not the typeface.

Typography is used to create clear information hierarchy. Bold weights are reserved for names and headings, while a lighter gray is used for secondary metadata (like timestamps) to keep the primary conversation readable.

## Layout & Spacing

The layout follows a **fluid grid** model. In the desktop view, the interface is split into functional panels (navigation, conversation list, and active chat). On mobile, it transitions to a single-column focus.

A strict 4px/8px baseline rhythm is applied to all components. This ensures that even in dense chat environments, the layout feels structured and intentional. Spacing is used generously between message groups to denote time lapses or changes in the flow of conversation.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-contrast outlines**. 

- **Primary Surface:** The main chat background is pure white (#FFFFFF).
- **Secondary Surface:** The sidebar and message list use a soft gray (#F8FAFC) to create a subtle separation of concerns.
- **Overlays:** Modals and context menus utilize a soft, ambient shadow (10% opacity, 15px blur) to appear "lifted" without looking heavy.
- **Borders:** Thin 1px strokes in a very light gray (#E2E8F0) are used instead of heavy shadows to define input fields and header boundaries.

## Shapes

The design system employs a **Rounded** (0.5rem) shape language. This softens the professional aesthetic, making the app feel more approachable and user-friendly.

- **Message Bubbles:** Use a high degree of rounding. For a modern touch, the "tail" corner of a bubble can have a smaller radius (4px) than the other three corners (16px) to indicate directionality.
- **Avatars:** Always rendered as circles to provide a clear visual distinction from square-ish message bubbles and UI components.
- **Buttons:** Fully rounded (pill-shaped) for primary actions to maximize clickability.

## Components

### Buttons
Primary buttons use the Action Blue with white text. Ghost buttons (outline only) are used for secondary actions to maintain the minimalist feel.

### Message Bubbles
- **Sent:** Action Blue background with white text.
- **Received:** Soft Gray (#F1F5F9) background with dark text.
- **Status:** Integrated subtly at the bottom right of the bubble (Sent/Delivered/Read).

### Input Fields
The message composer is a clean, white bar with a light border. It expands vertically as the user types. Icons for attachments and emojis are monochrome, turning blue only on interaction.

### Lists
Conversation lists use a 72px fixed height for items. They feature a clear hierarchy: Name (Bold), Snippet (Regular, Gray), and Time (Small, Gray). Active conversations are marked with a subtle 4px vertical blue line on the far left.

### Additional Components
- **Status Indicators:** Small 8px dots for Online/Away/Offline status, positioned at the corner of avatars.
- **Chips:** Used for quick-reply suggestions or filtering chat media. These should be low-contrast (light gray background) to avoid distracting from the main thread.