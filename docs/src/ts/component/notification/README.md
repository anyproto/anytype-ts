# notification/ - Toast Notification System

Transient notification display with actions and auto-dismissal. **1 file** (excluding stories).

## Files

- `index.tsx` - Notification component

## Features

- Animated entrance/exit via CSS class toggling (`from`/`to`)
- Auto-dismissal timers via `J.Constant.delay.notification`
- Action buttons per notification type:
  - **Import**: "View report" button when the payload carries `reportObjectId` (import v2 issue report page); otherwise "Switch Space" (when target space differs from current)
  - **Gallery**: "Switch Space" button (when target space differs from current)
  - **Join**: "Request" and "Switch Space" buttons
- Space removal and participant state checks filter out invalid buttons
- Button actions: `spaceSwitch` (navigate to space), `report` (open import report, switching space first if needed), `spaceDelete` (remove space), `request` (open invite confirm popup)
- Dismissed via `C.NotificationReply()` gRPC command
- Notifications managed by `S.Notification` store
