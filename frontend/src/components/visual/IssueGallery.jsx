import IssueCard from "./IssueCard";

export default function IssueGallery({ issues = [] }) {
  if (!issues.length) return null;

  return (
    <div className="space-y-5 mt-10">

      <h2 className="text-2xl font-bold">
        Smart Issues
      </h2>

      {issues.map((issue, index) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          index={index}
        />
      ))}

    </div>
  );
}