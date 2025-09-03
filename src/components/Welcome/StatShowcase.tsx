type Stat = {
    value: string;
    label: string;
    pill: { text: string; color: "purple" | "green" | "orange" };
    icon?: React.ReactNode;
  };
  
  const pillColor = {
    purple: "bg-[#cdb3ff] text-[#3a2266]",
    green: "bg-[#35d64d] text-white",
    orange: "bg-[#ff8b3d] text-white",
  };
  
  export default function StatsShowcase() {
    const stats: Stat[] = [
      {
        value: "50M",
        label: "Study resources",
        pill: { text: "1 new each second", color: "purple" },
        icon: <span className="text-xl">🗂️</span>,
      },
      {
        value: "120K",
        label: "Institutions",
        pill: { text: "In 100+ countries", color: "green" },
        icon: <span className="text-xl">🏛️</span>,
      },
      {
        value: "60M",
        label: "Users",
        pill: { text: "Every month", color: "orange" },
        icon: <span className="text-xl">👤</span>,
      },
    ];
  
    return (
        <section className="relative">
        {/* content */}
        <div className="relative z-10 max-w-[1100px] mx-auto px-6 py-16 md:py-24">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#111] text-center">
            Over 1 billion students helped, and counting
          </h2>
          <p className="mt-6 text-lg text-[#333]/80 text-center max-w-3xl mx-auto">
            50K new study notes added every day, from the world’s most active student communities
          </p>
  
          {/* stats row */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-10">
            {stats.map((s) => (
              <div key={s.value} className="text-center">
                <div className="text-[56px] md:text-[72px] leading-none font-extrabold text-[#0f0f0f]">
                  {s.value}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-lg text-[#222]">
                  {s.icon}
                  <span>{s.label}</span>
                </div>
                <div
                  className={`inline-flex mt-3 px-3 h-7 items-center rounded-full text-sm font-semibold ${pillColor[s.pill.color]}`}
                >
                  {s.pill.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  