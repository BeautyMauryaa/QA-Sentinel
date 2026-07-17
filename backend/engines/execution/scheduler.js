export function scheduleTests(project) {

    const jobs = [];

    const browsers =
        project.browsers || ["chromium"];

    const viewports =
        project.viewports || [

            {

                name: "desktop",

                width: 1440,

                height: 900

            }

        ];

    for (const page of project.pages) {

        for (const browser of browsers) {

            for (const viewport of viewports) {

                jobs.push({

                    page,

                    browser,

                    viewport,

                    status: "pending"

                });

            }

        }

    }

    return jobs;

}