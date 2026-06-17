import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import AdminGuard from "./components/AdminGuard";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";

const AnalysisPage = lazy(() => import("./pages/Analysis"));
const ReportPage = lazy(() => import("./pages/Report"));
const HistoryPage = lazy(() => import("./pages/History"));
const BatchPage = lazy(() => import("./pages/Batch"));
const SharePage = lazy(() => import("./pages/Share"));
const InvitePage = lazy(() => import("./pages/Invite"));
const AboutPage = lazy(() => import("./pages/About"));
const DepartmentReportPage = lazy(() => import("./pages/DepartmentReport"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const ComparePage = lazy(() => import("./pages/Compare"));
const BrandSettingsPage = lazy(() => import("./pages/BrandSettings"));
const AdminToolsPage = lazy(() => import("./pages/AdminTools"));
const LlmManagerPage = lazy(() => import("./pages/LlmManager"));
const LlmLogsPage = lazy(() => import("./pages/LlmLogs"));
const ConfirmPage = lazy(() => import("./pages/Confirm"));
const SharedReportPage = lazy(() => import("./pages/SharedReport"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <AnimatedPage key={location}>
            <Switch location={location}>
              <Route path="/" component={Home} />
              <Route path="/confirm/:id" component={ConfirmPage} />
              <Route path="/analysis/:id" component={AnalysisPage} />
              <Route path="/report/:id" component={ReportPage} />
              <Route path="/history" component={HistoryPage} />
              <Route path="/batch" component={BatchPage} />
              <Route path="/share/:token" component={SharedReportPage} />
              <Route path="/share" component={SharePage} />
              <Route path="/invite/:code" component={InvitePage} />
              <Route path="/about" component={AboutPage} />
              <Route path="/department-report" component={DepartmentReportPage} />
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/compare" component={ComparePage} />
              <Route path="/brand-settings" component={BrandSettingsPage} />
              <Route path="/admin-tools" component={AdminToolsPage} />
              <Route path="/llm-manager">
                <AdminGuard><LlmManagerPage /></AdminGuard>
              </Route>
              <Route path="/llm-logs">
                <AdminGuard><LlmLogsPage /></AdminGuard>
              </Route>
              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </AnimatedPage>
        </AnimatePresence>
      </Suspense>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
