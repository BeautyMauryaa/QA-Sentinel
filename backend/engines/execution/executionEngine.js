import { createExecutionContext } from "./executionContext.js";
import { scheduleTests } from "./scheduler.js";

export async function run(project) {

    console.log("\n========== Execution Engine ==========\n");

    const context = createExecutionContext(project);

    const jobs = scheduleTests(project);

    context.tests = jobs;

    console.log(
        `Created ${jobs.length} test jobs`
    );

    return context;

}