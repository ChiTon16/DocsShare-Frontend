// components/landing/WorkPlayCTA.tsx
export default function WorkPlayCTA() {
    return (
      <section className="relative">
        {/* dải nền sáng phía trên (để thấy blob chòi xuống) */}
        <div className="h-20 bg-[#f6f7fb]" />
  
        {/* Khối CTA nền xanh đậm */}
        <div className="relative bg-[#3f6766] text-white">
          
  
          {/* Nội dung */}
          <div className="relative z-20 max-w-[1100px] mx-auto px-6 py-16 md:py-24 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              We work hard &amp; We play hard!
            </h2>
            <p className="mt-4 text-white/85 text-lg max-w-3xl mx-auto">
              Want to know more about our company culture, values and job openings?
            </p>
  
            <div className="mt-10">
              <a
                href="#careers"
                className="inline-flex items-center justify-center px-7 md:px-9 h-12 md:h-14 rounded-full
                           bg-[#d9ff5b] text-[#233a39] font-semibold text-base md:text-lg
                           shadow-[0_10px_24px_rgba(217,255,91,.35)]
                           hover:brightness-105 active:translate-y-[1px] transition"
              >
                Check our openings
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }
  