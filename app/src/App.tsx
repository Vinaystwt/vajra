import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ScrollToTop } from "./components/layout/ScrollToTop";
import { Landing } from "./pages/Landing";
import { WhyVajra } from "./pages/WhyVajra";
import { Proofs } from "./pages/Proofs";
import { Developers } from "./pages/Developers";
import { AttackLab } from "./pages/AttackLab";
import { pageVariants, pageTransition } from "./lib/motion";

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: "#050505", color: "#EDEDED" }}>
      <ScrollToTop />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
          <Route path="/attack-lab" element={<PageWrapper><AttackLab /></PageWrapper>} />
          <Route path="/proofs" element={<PageWrapper><Proofs /></PageWrapper>} />
          <Route path="/developers" element={<PageWrapper><Developers /></PageWrapper>} />
          <Route path="/why" element={<PageWrapper><WhyVajra /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  );
}
