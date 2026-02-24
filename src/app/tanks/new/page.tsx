import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { Container, Title, Paper } from "@mantine/core";
import { TankForm } from "@/features/tanks/components/TankForm";

export default async function NewTankPage() {
  const session = await auth0.getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">
        Add a New Tank
      </Title>
      <Paper withBorder shadow="sm" p="xl" radius="md">
        <TankForm />
      </Paper>
    </Container>
  );
}
