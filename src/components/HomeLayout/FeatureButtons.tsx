const features = [
    {
      label: "Create a quiz",
      icon: "📝", // bạn có thể thay bằng SVG nếu muốn
    },
    {
      label: "Ask a Question",
      icon: "❓",
    },
    {
      label: "Summarize your notes",
      icon: "🗒️",
    },
  ];
  
  const FeatureButtons = () => {
    return (
      <div className="grid grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-6 py-4 bg-gray-100 rounded-xl shadow hover:bg-gray-200 cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{feature.icon}</div>
              <span className="text-sm font-medium text-gray-700">{feature.label}</span>
            </div>
            <span className="text-xl text-gray-400">&rarr;</span>
          </div>
        ))}
      </div>
    );
  };
  
  export default FeatureButtons;
  