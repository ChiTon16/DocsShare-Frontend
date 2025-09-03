export default function BlobBackground() {
    return (
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Blob trái */}
        <div className="absolute -left-40 top-20 w-[360px] h-[360px]
                        rounded-[62%_38%_50%_50%/44%_40%_60%_56%] bg-[#f06bff] opacity-70" />
  
        {/* Blob phải */}
        <div className="absolute right-[-100px] top-[500px] w-[420px] h-[240px]
                        rounded-[60%_40%_60%_40%/60%_40%_60%_40%] bg-[#E4FF6A] opacity-80" />
      </div>
    );
  }
  