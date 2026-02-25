import { getAuthUser } from "@/lib/auth/session";
import { AppNav } from "@/components/AppNav";
import { Container, Title, Paper, Button, Group } from "@mantine/core";
import { TankForm } from "@/features/tanks/components/TankForm";

export default async function NewTankPage() {
  await getAuthUser();

  return (
    <>
      <AppNav />
      <Container size="sm" py="xl">
        <Group mb="lg">
          <Button component="a" href="/" variant="subtle" size="sm" color="gray">
            ← My Tanks
          </Button>
        </Group>
        <Title order={2} mb="lg">Add a New Tank</Title>
        <Paper withBorder p="xl">
          <TankForm />
        </Paper>
      </Container>
    </>
  );
}
