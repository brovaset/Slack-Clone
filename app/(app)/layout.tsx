import AuthGuard from "@/components/AuthGuard";
import { AppProvider } from "@/lib/context/AppContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppProvider>{children}</AppProvider>
    </AuthGuard>
  );
}
