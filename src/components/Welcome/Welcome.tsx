import Footer from "../Footer/Footer";
import BlobBackground from "./BlobBackground";
import HeaderBar from "./HeaderBar";
import HeroBanner from "./HeroBanner";
import StatsShowcase from "./StatShowcase";
import WorkPlayCTA from "./WorldPlayCTA";

export default function LandingPage() {
  return (
    <div className="relative bg-white font-[DM_Sans]">
      {/* Header */}
      <HeaderBar />
      {/* Blob nền chung */}
      <BlobBackground />

      {/* Nội dung */}
      <div className="relative z-10 pt-16 md:pt-20">
        <HeroBanner />
        <StatsShowcase />
        <WorkPlayCTA />
        <Footer />
      </div>
    </div>
  );
}
