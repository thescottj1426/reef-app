"use client";

import { Menu, Avatar, Text } from "@mantine/core";

interface UserMenuProps {
  displayName: string | null;
  username: string;
  avatarUrl: string | null;
}

export function UserMenu({ displayName, username, avatarUrl }: UserMenuProps) {
  const label = displayName ?? username;
  const initials = label.slice(0, 2).toUpperCase();

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <Avatar
          src={avatarUrl}
          alt={label}
          radius="xl"
          size="sm"
          color="teal"
          style={{ cursor: "pointer" }}
        >
          {initials}
        </Avatar>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{displayName ?? `@${username}`}</Menu.Label>
        <Menu.Label c="dimmed" fz={11} mt={-6}>
          @{username}
        </Menu.Label>
        <Menu.Divider />
        <Menu.Item component="a" href="/settings/profile">
          Edit Profile
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item component="a" href="/auth/sign-out" color="red">
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
