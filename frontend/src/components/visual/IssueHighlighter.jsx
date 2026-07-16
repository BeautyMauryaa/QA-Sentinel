export default function IssueHighlighter({

    issue,

    imageWidth,

    imageHeight

}) {

    if (!issue) return null;

    const left =
        (issue.location.x / imageWidth) * 100;

    const top =
        (issue.location.y / imageHeight) * 100;

    const width =
        (issue.location.width / imageWidth) * 100;

    const height =
        (issue.location.height / imageHeight) * 100;

    return (

        <div
            className="absolute border-4 border-red-500 rounded-lg pointer-events-none animate-pulse"
            style={{

                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`

            }}
        />

    );

}