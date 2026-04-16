import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth-guard";

export default function ErpLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AppProvider>
          <AuthGuard>
            <div className="flex h-screen overflow-hidden bg-background">
              <Sidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto">{children}</main>
              </div>
            </div>
          </AuthGuard>
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
