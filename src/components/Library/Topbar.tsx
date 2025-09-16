import SearchIcon from "@mui/icons-material/Search";

export default function Topbar() {
  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center">
        <div className="flex-1">
          <label className="relative block">
            <span className="absolute inset-y-0 left-3 flex items-center">
              <SearchIcon className="text-slate-400" fontSize="small" />
            </span>
            <input
              type="text"
              placeholder="Search for courses, quizzes, or documents"
              className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </label>
        </div>
      </div>
    </header>
  );
}
