import { UnauthorizedState } from "@/components/feedback/unauthorized-state";
import { Container } from "@/components/layout/container";

export default function UnauthorizedPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-16">
      <Container size="sm">
        <UnauthorizedState />
      </Container>
    </div>
  );
}
