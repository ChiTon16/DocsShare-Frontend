import React from "react";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";

interface ViewedCardProps {
  title: string;
  subtitle?: string;
  documents: string;
  isFollowing: boolean;
}

const ViewedCard: React.FC<ViewedCardProps> = ({
  title,
  subtitle,
  documents,
  isFollowing,
}) => {
  return (
    <div className="bg-[#ecfcda] border border-green-100 rounded-xl w-[175px] h-[200px] p-3 shadow-sm flex flex-col justify-between font-[DM_Sans] hover:bg-[#cff5b7] transition">
      <div className="flex flex-col gap-1">
        <FolderIcon className="text-[#2cc302] !text-2xl" />
        <h3 className="text-sm font-medium text-gray-900 leading-tight">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        )}
        <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
          <DescriptionIcon className="text-gray-500 !text-base" />
          {documents}
        </div>
      </div>

      <button
        className={`mt-2 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
          isFollowing
            ? "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
        }`}
      >
        {isFollowing ? "Unfollow" : (
          <span className="flex items-center justify-center gap-1 text-xs">
          <span className="">＋</span> Follow
        </span>
        
        )}
      </button>
    </div>
  );
};

export default ViewedCard;
