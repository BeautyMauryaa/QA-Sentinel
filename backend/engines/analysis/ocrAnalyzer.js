export async function extractText(page) {

    console.log("\n========== OCR Analyzer ==========\n");

    const textBlocks = await page.evaluate(() => {

        function selector(el) {

            if (el.id)
                return "#" + el.id;

            if (el.className)
                return "." + el.className
                    .toString()
                    .split(" ")[0];

            return el.tagName.toLowerCase();

        }

        const elements = [
            ...document.querySelectorAll(
                "h1,h2,h3,h4,h5,h6,p,span,button,a,label"
            )
        ];

        return elements
            .map(el => {

                const text = el.innerText.trim();

                if (!text)
                    return null;

                const rect = el.getBoundingClientRect();

                return {

                    selector: selector(el),

                    tag: el.tagName,

                    text,

                    x: rect.x,

                    y: rect.y,

                    width: rect.width,

                    height: rect.height

                };

            })
            .filter(Boolean);

    });

    console.log(
        "Text Blocks:",
        textBlocks.length
    );

    return textBlocks;
}