import { useRiskScores } from "../hooks/useAnalytics";

export default function RiskPage() {
  const { data: risks, isLoading } = useRiskScores();

  console.log("RISKS:", risks);

  if (isLoading) {
    return <div className="p-6 text-white">Loading risk data...</div>;
  }

  if (!risks || risks.length === 0) {
    return <div className="p-6 text-white">No Risk Data Available</div>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Risk Analysis</h1>

      <div className="grid gap-4">
        {risks.map((risk) => (
          <div
            key={risk.id}
            className="p-4 rounded-lg bg-[#111827] border border-white/10 shadow-md"
          >
            <p className="text-sm text-gray-400">User ID</p>
            <p className="text-lg font-semibold">{risk.user_id}</p>

            <p className="text-sm text-gray-400 mt-2">Risk Score</p>
            <p
              className={`text-lg font-bold ${
                risk.score > 70
                  ? "text-red-400"
                  : risk.score > 40
                    ? "text-yellow-400"
                    : "text-green-400"
              }`}
            >
              {risk.score}
            </p>

            <p className="text-sm text-gray-400 mt-2">Reason</p>
            <p className="text-white">{risk.rationale}</p>

            <p className="text-xs text-gray-500 mt-2">
              Updated: {new Date(risk.last_updated).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
