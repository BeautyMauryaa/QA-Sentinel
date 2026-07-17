export function compareText(
    baseline,
    current
) {

    const issues = [];

    baseline.forEach(base => {

        const live = current.find(
            item =>
                item.selector === base.selector
        );

        if (!live) {

            issues.push({

                selector: base.selector,

                type: "TEXT_REMOVED",

                expected: base.text,

                actual: ""

            });

            return;

        }

        if (base.text !== live.text) {

            issues.push({

                selector: base.selector,

                type: "TEXT_CHANGED",

                expected: base.text,

                actual: live.text

            });

        }

    });

    return issues;

}