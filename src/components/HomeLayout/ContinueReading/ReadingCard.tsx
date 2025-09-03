import React, { useState } from "react";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

interface ReadingCardProps {
  title: string;
  category: string;
  imageUrl?: string; // blob/object URL hoặc link ảnh
}

const ReadingCard: React.FC<ReadingCardProps> = ({ title, category, imageUrl }) => {
  const [broken, setBroken] = useState(false);

  return (
    <div className="w-full h-80 bg-white hover:bg-[#f1f7fe] rounded-xl overflow-hidden flex flex-col transition duration-200">
      <div className="w-full rounded-xl p-2">
        <div className="h-24 w-full rounded-xl overflow-hidden flex items-center justify-center bg-gray-100">
          {imageUrl && !broken ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : (
            <PictureAsPdfIcon style={{ fontSize: 48, color: "#d32f2f" }} />
          )}
        </div>
      </div>

      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-500">{category}</p>
        </div>
        <div className="flex justify-end">
          <BookmarkBorderIcon className="text-gray-500 cursor-pointer hover:text-gray-800" />
        </div>
      </div>
    </div>
  );
};

export default ReadingCard;
