export function buildComparisonStrategy(domAnalysis) {

    const strategy = {
        pixel: [],
        layout: [],
        freeze: [],
        mask: [],
        ignore: []
    };

    if (!domAnalysis?.sections) {
        return strategy;
    }

    for (const section of domAnalysis.sections) {

        switch (section.type) {

            case "STATIC":
                strategy.pixel.push(section);
                break;

            case "LAYOUT_ONLY":
                strategy.layout.push(section);
                break;

            case "VIDEO":

            case "IFRAME":

            case "CANVAS":
                strategy.freeze.push(section);
                break;

            case "CAROUSEL":

            case "SCROLLABLE":
                strategy.mask.push(section);
                break;

            default:
                strategy.ignore.push(section);
        }
    }

    return strategy;
}