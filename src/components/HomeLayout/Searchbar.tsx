const SearchBar = () => {
  return (
    <div className="w-full">
      <input
        type="text"
        placeholder="Search for courses, quizzes, or documents"
        className="w-full px-5 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
};

export default SearchBar;
