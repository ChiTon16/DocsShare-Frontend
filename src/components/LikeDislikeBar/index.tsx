import React from "react";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";

export type LikeState = "like" | "dislike" | null;

type Props = {
  likes: number;
  dislikes: number;
  userAction: LikeState;
  onLike: () => void;
  onDislike: () => void;
  /** click để lưu (mở modal chọn Study Plan hoặc lưu nhanh) */
  onSave: () => void;
  /** đã lưu hay chưa (để đổi style/icon) */
  saved?: boolean;
  className?: string;
};

const LikeDislikeBar: React.FC<Props> = ({
  likes,
  dislikes,
  userAction,
  onLike,
  onDislike,
  onSave,
  saved = false,
  className = "",
}) => {
  return (
    <div className={`px-4 md:px-6 py-2 bg-white/90 backdrop-blur ${className}`}>
      <div className="flex items-center justify-end gap-3">
        {/* Like */}
        <button
          onClick={onLike}
          className={[
            "group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5",
            "text-sm font-medium shadow-sm border transition",
            userAction === "like"
              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
          ].join(" ")}
          aria-pressed={userAction === "like"}
          title="Like"
        >
          <span
            className={[
              "grid place-items-center rounded-full h-6 w-6",
              userAction === "like"
                ? "bg-emerald-100"
                : "bg-gray-100 group-hover:bg-gray-200",
            ].join(" ")}
          >
            <ThumbUpIcon
              fontSize="small"
              className={userAction === "like" ? "text-emerald-600" : "text-gray-600"}
            />
          </span>
          <span className="tabular-nums">{likes}</span>
        </button>

        {/* Dislike */}
        <button
          onClick={onDislike}
          className={[
            "group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5",
            "text-sm font-medium shadow-sm border transition",
            userAction === "dislike"
              ? "bg-red-50 border-red-200 text-red-600"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
          ].join(" ")}
          aria-pressed={userAction === "dislike"}
          title="Dislike"
        >
          <span
            className={[
              "grid place-items-center rounded-full h-6 w-6",
              userAction === "dislike"
                ? "bg-red-100"
                : "bg-gray-100 group-hover:bg-gray-200",
            ].join(" ")}
          >
            <ThumbDownIcon
              fontSize="small"
              className={userAction === "dislike" ? "text-red-600" : "text-gray-600"}
            />
          </span>
          <span className="tabular-nums">{dislikes}</span>
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          className={[
            "group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5",
            "text-sm font-medium shadow-sm border transition",
            saved
              ? "bg-blue-50 border-blue-200 text-blue-600"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
          ].join(" ")}
          aria-pressed={saved}
          title={saved ? "Saved to Study Plan" : "Save to Study Plan"}
        >
          <span
            className={[
              "grid place-items-center rounded-full h-6 w-6",
              saved ? "bg-blue-100" : "bg-gray-100 group-hover:bg-gray-200",
            ].join(" ")}
          >
            {saved ? (
              <BookmarkIcon fontSize="small" className="text-blue-600" />
            ) : (
              <BookmarkBorderIcon fontSize="small" className="text-gray-600" />
            )}
          </span>
          <span>{saved ? "Saved" : "Save"}</span>
        </button>
      </div>
    </div>
  );
};


export default LikeDislikeBar;
