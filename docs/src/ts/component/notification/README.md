# notification/ - Toast Notification System

Transient notification display with actions and auto-dismissal.

## Files

- `index.tsx` - Notification component

## Features

- Animated entrance/exit via CSS class toggling
- Auto-dismissal timers
- Action buttons per notification type:
  - **Gallery/Import**: "Switch Space" button
  - **Join**: "Request" and "Switch Space" buttons
- Notifications managed by `S.Notification` store
- Dismissed via `C.NotificationReply()` gRPC command
