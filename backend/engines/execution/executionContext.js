import crypto from "crypto";

export function createExecutionContext(config) {

    return {

        id: crypto.randomUUID(),

        project: config.project,

        environment: config.environment || "local",

        browser: config.browser || "chromium",

        viewport: config.viewport || {

            width: 1440,

            height: 900

        },

        baselineVersion:
            config.baselineVersion || "latest",

        startedAt: new Date(),

        status: "running",

        tests: [],

        reports: []

    };

}