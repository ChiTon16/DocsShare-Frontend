export default function HeroBanner() {
  return (
    <section className="px-3 md:px-6">
      <div
        className="mx-auto max-w-[1200px] rounded-[24px] md:rounded-[28px] 
                   bg-white shadow-[0_12px_40px_rgba(0,0,0,.08)] border border-black/5
                   p-5 md:p-10"
      >
        <div className="grid md:grid-cols-2 items-center gap-8 md:gap-12">
          {/* Left copy */}
          <div>
            <p className="text-lg md:text-xl font-semibold text-gray-500">Hi ! we’re</p>
            <h1 className="mt-1 text-[42px] leading-[1.05] md:text-[56px] font-extrabold text-[#1c1c1c]">
              Weebies.
            </h1>
            <p className="mt-4 text-base md:text-lg text-gray-500 max-w-prose">
              We make beautiful looking <br className="hidden md:block" />
              professional websites for you
            </p>

            <div className="mt-8">
              <a
                href="#"
                className="inline-flex items-center justify-center h-14 px-7 md:px-10 rounded-[18px]
                           text-white text-lg md:text-xl font-extrabold
                           bg-gradient-to-r from-emerald-600 to-emerald-500
                           shadow-[0_18px_36px_rgba(16,185,129,.35)]
                           hover:shadow-[0_22px_44px_rgba(16,185,129,.45)]
                           transition"
              >
                Create a website
              </a>
            </div>
          </div>

          {/* Right illustration (SVG placeholder) */}
          <div className="relative">
            <div className="mx-auto aspect-[4/3] w-full max-w-[520px] rounded-[16px] border border-gray-200">
              {/* Simple illustration-style card */}
              <div className="grid grid-rows-[auto_1fr_auto] h-full">
                <div className="h-8 bg-gray-100 border-b border-gray-200 rounded-t-[16px]" />
                <div className="p-6 flex gap-6">
                  {/* avatar circle */}
                  <div className="shrink-0 w-24 h-24 rounded-full border-4 border-gray-200 grid place-items-center">
                    <div className="w-14 h-14 rounded-[6px] bg-emerald-600" />
                  </div>
                  {/* lines */}
                  <div className="flex-1 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-2 bg-gray-200 rounded" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-8 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            </div>

            {/* leaves decoration */}
            <div className="pointer-events-none absolute -left-6 bottom-4 w-16 h-16 rounded-[40%] rotate-12 bg-emerald-200/70" />
            <div className="pointer-events-none absolute -right-5 bottom-6 w-14 h-24 rounded-[50%] -rotate-6 bg-emerald-300/70" />
          </div>
        </div>
      </div>
    </section>
  );
}
