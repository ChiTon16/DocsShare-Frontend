import PdfPreview from "@/components/PdfViewerPro";

export default function AppPage() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header cao cố định */}
      

      {/* Vùng content chiếm phần còn lại */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <PdfPreview />
      </div>
    </div>
  );
}
