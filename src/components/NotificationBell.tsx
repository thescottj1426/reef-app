"use client";

import { ActionIcon, Indicator } from "@mantine/core";

interface NotificationBellProps {
  unreadCount: number;
}

export function NotificationBell({ unreadCount }: NotificationBellProps) {
  return (
    <Indicator
      label={unreadCount > 9 ? "9+" : String(unreadCount)}
      size={16}
      disabled={unreadCount === 0}
      color="red"
      offset={4}
    >
      <ActionIcon
        component="a"
        href="/notifications"
        variant="subtle"
        color="gray"
        size="lg"
        aria-label="Notifications"
      >
        <span style={{ fontSize: 18 }}>🔔</span>
      </ActionIcon>
    </Indicator>
  );
}
