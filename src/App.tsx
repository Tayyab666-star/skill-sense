import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import ConnectSources from "./pages/ConnectSources";
import DataSources from "./pages/DataSources";
import Goals from "./pages/Goals";
import JobMatching from "./pages/JobMatching";
import TeamAnalysis from "./pages/TeamAnalysis";
import Settings from "./pages/Settings";
import LearningPath from "./pages/LearningPath";
import UserGuide from "./pages/UserGuide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/connect" element={<ConnectSources />} />
          <Route path="/sources" element={<DataSources />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/jobs" element={<JobMatching />} />
          <Route path="/team" element={<TeamAnalysis />} />
          <Route path="/learning-path" element={<LearningPath />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/guide" element={<UserGuide />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
