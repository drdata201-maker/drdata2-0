import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import CompleteProfile from "./pages/CompleteProfile";
import Dashboard from "./pages/Dashboard";
import FreelanceDashboard from "./pages/FreelanceDashboard";
import EnterpriseDashboard from "./pages/EnterpriseDashboard";
import PmeDashboard from "./pages/PmeDashboard";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AnalysisWorkspace from "./pages/AnalysisWorkspace";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />

          {/* Student dashboards */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/student-license" element={<Dashboard />} />
          <Route path="/dashboard/student-license/*" element={<Dashboard />} />
          <Route path="/dashboard/student-master" element={<Dashboard />} />
          <Route path="/dashboard/student-master/*" element={<Dashboard />} />
          <Route path="/dashboard/student-doctorate" element={<Dashboard />} />
          <Route path="/dashboard/student-doctorate/*" element={<Dashboard />} />

          {/* Freelance dashboard */}
          <Route path="/dashboard/freelance" element={<FreelanceDashboard />} />
          <Route path="/dashboard/freelance/*" element={<FreelanceDashboard />} />

          {/* PME dashboard */}
          <Route path="/dashboard/pme" element={<PmeDashboard />} />
          <Route path="/dashboard/pme/*" element={<PmeDashboard />} />

          {/* Enterprise dashboard */}
          <Route path="/dashboard/enterprise" element={<EnterpriseDashboard />} />
          <Route path="/dashboard/enterprise/*" element={<EnterpriseDashboard />} />

          {/* Analysis workspace */}
          <Route path="/analysis/workspace" element={<AnalysisWorkspace />} />

          {/* Static pages */}
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
