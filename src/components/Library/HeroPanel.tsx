import { useNavigate } from "react-router-dom";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AssignmentIcon from "@mui/icons-material/Assignment";

type Props = {
  onStartStudyPlan?: () => void; // 👈 thêm prop
};

export default function HeroPanel({ onStartStudyPlan }: Props) {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-7xl px-4 mt-6">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Upload */}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 hover:border-blue-400">
          <button
            className="flex items-center gap-4 w-full"
            onClick={() => navigate("/upload")}
          >
            <CloudUploadIcon fontSize="large" className="text-blue-600" />
            <div className="text-left">
              <div className="font-semibold">
                Upload a document to start working on it
              </div>
              <p className="text-sm text-slate-500">
                Use AI chat to summarize, rephrase, and ask questions • Generate
                flashcards • Practice with quizzes
              </p>
            </div>
          </button>
        </div>

        {/* Study Plan */}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 hover:border-blue-400">
          <button
            className="flex items-center gap-4 w-full"
            onClick={onStartStudyPlan} // 👈 gọi prop
          >
            <AssignmentIcon fontSize="large" className="text-orange-500" />
            <div className="text-left">
              <div className="font-semibold">
                Start a study plan to nail your next exam
              </div>
              <p className="text-sm text-slate-500">
                Plan your study • Generate quizzes & flashcards • Collaborate
                with classmates
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
