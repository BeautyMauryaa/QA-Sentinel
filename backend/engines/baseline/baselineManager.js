import fs from "fs/promises";
import path from "path";

export async function createBaselinePackage({
    pageName,
    screenshot,
    layout,
    text,
    components,
    metadata
}) {
    const folder = path.join(
        process.cwd(),
        "baseline",
        pageName
    );

    await fs.mkdir(folder, { recursive: true });
    await fs.copyFile(
        screenshot,
        path.join(folder, "screenshot.png")
    );
    await fs.writeFile(
        path.join(folder, "layout.json"),
        JSON.stringify(layout, null, 2)
    );
    await fs.writeFile(
        path.join(folder, "text.json"),
        JSON.stringify(text, null, 2)
    );

    await fs.writeFile(
        path.join(folder, "components.json"),
        JSON.stringify(components, null, 2)
    );

    await fs.writeFile(
        path.join(folder, "metadata.json"),
        JSON.stringify(metadata, null, 2)
    );
    return folder;
}

export async function loadBaseline(pageName) {
    const folder = path.join(
        process.cwd(),
        "baseline",
        pageName
    );
    return {
        screenshot:
            path.join(folder, "screenshot.png"),
        layout: JSON.parse(
            await fs.readFile(
                path.join(folder, "layout.json")
            )
        ),
        text: JSON.parse(
            await fs.readFile(
                path.join(folder, "text.json")
            )
        ),
        components: JSON.parse(
            await fs.readFile(
                path.join(folder, "components.json")
            )
        ),

        metadata: JSON.parse(
            await fs.readFile(
                path.join(folder, "metadata.json")
            )
        )
    };
}