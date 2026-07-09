import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import SiteGate from "./components/SiteGate";
import AdminGuard from "./components/AdminGuard";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";
import { motion } from "framer-motion";

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
          <AnimatedPage key={location}>
            <Switch location={location}>
              {/* ===== 普通用户可访问页面（无需密码）===== */}
              <Route path="/" component={Home} />
              <Route path="/confirm/:id" component={ConfirmPage} />
              <Route path="/analysis/:id" component={AnalysisPage} />
              <Route path="/report/:id" component={ReportPage} />
              <Route path="/share/:token" component={SharedReportPage} />
              <Route path="/share" component={SharePage} />
              <Route path="/invite/:code" component={InvitePage} />
              <Route path="/about" component={AboutPage} />

              {/* ===== 普通用户可访问的业务页面（无需密码）===== */}
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/history" component={HistoryPage} />
              <Route path="/batch" component={BatchPage} />
              <Route path="/compare" component={ComparePage} />
              <Route path="/department-report" component={DepartmentReportPage} />
              <Route path="/brand-settings" component={BrandSettingsPage} />
              <Route path="/admin-tools" component={AdminToolsPage} />

              {/* ===== 平台管理页面（入口仅管理员可见；直接访问 URL 仍需管理员密码 bestqiai2026）===== */}
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
          {/* [定制] 全局进站密码门：任何页面都需先输入进站密码 bestqi（分享链接免密）。
              管理员密码 bestqiai2026 另外控制“模型管理/调用日志”入口可见性。 */}
          <SiteGate>
            <Router />
          </SiteGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
