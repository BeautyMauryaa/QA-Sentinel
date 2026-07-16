export default function SummaryCard({ summary, issueSummary }) {

  return (

    <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">

      <div className="flex justify-between items-center">

        <div>

          <h2 className="text-2xl font-bold">

            {summary.status}

          </h2>

          <p className="text-gray-400">

            {summary.message}

          </p>

        </div>

        <div className="text-right">

          <div className="text-5xl font-bold text-blue-400">

            {summary.score}%

          </div>

          <div className="text-gray-400">

            Similarity

          </div>

        </div>

      </div>

      <div className="grid grid-cols-5 gap-4 mt-8">

        <Stat
          title="Issues"
          value={issueSummary.total}
        />

        <Stat
          title="Critical"
          value={issueSummary.critical}
          color="text-red-500"
        />

        <Stat
          title="High"
          value={issueSummary.high}
          color="text-orange-400"
        />

        <Stat
          title="Medium"
          value={issueSummary.medium}
          color="text-yellow-400"
        />

        <Stat
          title="Low"
          value={issueSummary.low}
          color="text-green-400"
        />

      </div>

    </div>

  );

}

function Stat({

  title,

  value,

  color = "text-white"

}) {

  return (

    <div className="bg-gray-800 rounded-lg p-4 text-center">

      <div className={`text-2xl font-bold ${color}`}>

        {value}

      </div>

      <div className="text-gray-400 text-sm">

        {title}

      </div>

    </div>

  );

}