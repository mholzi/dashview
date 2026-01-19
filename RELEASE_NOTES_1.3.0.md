# Dashview v1.3.0 Release Notes

**Release Date:** January 2026

---

## Get Started in Minutes with the New Setup Wizard

Setting up your smart home dashboard has never been easier. Version 1.3.0 introduces a **Guided Setup Wizard** that walks you through the entire configuration process - from organizing your floors and rooms to customizing exactly which devices appear on your dashboard.

No more staring at a blank screen wondering where to start. The wizard automatically launches for new installations and guides you step-by-step:

1. **Welcome** - Quick overview of what you can do with Dashview
2. **Floors** - Arrange your floors in the order you prefer
3. **Rooms** - Organize rooms within each floor
4. **Labels** - Connect your Home Assistant labels to dashboard categories
5. **Entities** - Choose which devices to show in each room
6. **Dashboard Layout** - Design your floor card grid with your favorite entities
7. **Review** - Verify everything looks right before you finish

Your progress saves automatically, so you can close the browser and pick up right where you left off. And if you ever want to start fresh, just hit "Re-run Setup Wizard" in the Admin panel.

---

## A Smoother, More Responsive Experience

We've completely overhauled how the dashboard responds to your touch:

- **Intuitive Light Control** - Tap to toggle lights on/off, slide to adjust brightness. It just works the way you'd expect.
- **Faster Feedback** - New loading animations show you exactly what's happening while data loads
- **Better Error Messages** - When something goes wrong, you'll see clear, helpful messages instead of cryptic errors
- **Reliable Performance** - Operations now have smart timeouts so you're never left waiting forever

---

## Polished Visuals

- **Unified Design** - Refined color palette for a cleaner, more cohesive look
- **Home Assistant Integration** - Dashboard now respects your HA theme settings
- **Improved Dark Mode** - Better visibility for toggle switches and controls
- **Mobile Touch** - Volume and cover sliders now work smoothly on phones and tablets

---

## Better Timestamps

Entity timestamps now show when something *actually* changed - not just time since Home Assistant restarted. See "5 minutes ago" or "2 days ago" with accurate, real-time updates.

---

## Full Language Support

Every button, message, and label is now fully translated in English and German. No more random untranslated strings breaking the experience.

---

## Upgrade Notes

- **Fully backward compatible** - Your existing settings are preserved
- **Wizard only for new installs** - Existing users won't see the wizard unless you choose to re-run it
- **Re-run anytime** - Find "Re-run Setup Wizard" in Admin > Setup

---

## Coming Soon

- **Dashboard Modes** - Automatically switch between Day, Night, and Away configurations
- **Alarm Integration** - Arm and disarm your security system directly from the dashboard

---

## What's Changed

### New Features

- Guided Setup Wizard with 7-step onboarding flow
- New Setup tab in Admin panel
- Home Assistant setup guidance in wizard

### Improvements

- Light tap/slide gestures work correctly
- Loading states with smooth animations
- Smart timeouts prevent infinite loading
- User-friendly error messages
- More-info dialogs appear above popups
- Accurate entity timestamps
- Unified color palette
- HA theme background support
- Dark mode toggle visibility
- Mobile touch support for sliders
- Complete English and German translations

### Bug Fixes

- Wizard settings now persist correctly
- Wizard only launches on fresh installs
- Floor/room ordering syncs properly
- Entity filtering shows correct entities per floor
- Popup layering works with HA dialogs
