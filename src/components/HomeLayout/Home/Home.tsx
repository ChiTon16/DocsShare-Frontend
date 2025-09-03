// src/pages/Home/Home.tsx
import Footer from "../../Footer/Footer";
import ContinueReading from "../ContinueReading/ContinueReading";
import FeatureButtons from "../FeatureButtons";
import RecentlyViewed from "../RecentlyView/RecentlyView";
import SearchBar from "../Searchbar";

const Home = () => {
  return (
    <div className="w-full bg-white">
      <div className="px-8 py-6 space-y-6">
        <SearchBar />
        <FeatureButtons />
        <ContinueReading />       {/* ← bỏ prop userId */}
        <RecentlyViewed />
      </div>
      <Footer />
    </div>
  );
};

export default Home;
