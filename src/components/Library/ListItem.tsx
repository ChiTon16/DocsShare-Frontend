import { Link } from "react-router-dom";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderIcon from "@mui/icons-material/Folder";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import clsx from "clsx";

type Props = {
  title: string;
  subtitle?: string;
  tag?: string;
  icon?: "doc" | "folder" | "course";
  onClick?: () => void;
  to?: string; // <- dùng Link khi có
  className?: string;
};

export default function ListItem({
  title,
  subtitle,
  tag,
  icon = "doc",
  onClick,
  to,
  className,
}: Props) {
  const iconMap = {
    doc: <DescriptionIcon className="text-slate-500" fontSize="small" />,
    folder: <FolderIcon className="text-orange-500" fontSize="small" />,
    course: <MenuBookIcon className="text-green-600" fontSize="small" />,
  };

  const inner = (
    <>
      <div className="flex items-center gap-3">
        {iconMap[icon]}
        <div className="min-w-0">
          <div className="font-medium truncate">{title}</div>
          {subtitle && <div className="text-sm text-slate-500 truncate">{subtitle}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {tag && (
          <span className="inline-flex items-center rounded-full bg-pink-50 text-pink-700 text-xs font-medium px-2 py-0.5">
            {tag}
          </span>
        )}
        {(to || onClick) && <ChevronRightIcon className="text-slate-400" fontSize="small" />}
      </div>
    </>
  );

  const baseCls = clsx(
    "flex items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-50 transition",
    className
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={clsx(baseCls, "no-underline")}>
        {inner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={clsx(baseCls, "w-full text-left")}>
        {inner}
      </button>
    );
  }

  return <div className={baseCls}>{inner}</div>;
}
