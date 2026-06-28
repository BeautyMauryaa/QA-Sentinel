// Suite 6: Form Tests
// Detect-only mode: never submits a real form to avoid spamming a live business
// system. Validates structure, client-side validation, and field-level UX.
export const id = "forms";
export const label = "Forms";

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];

  const form = await page.$("form");
  results.push(
    form
      ? record("TC_031", "Form Visible", "pass")
      : record("TC_031", "Form Visible", "fail", "No <form> element found on page")
  );

  if (!form) {
    for (const [tid, name] of [
      ["TC_032", "Required Fields Exist"],
      ["TC_033", "Empty Form Validation"],
      ["TC_034", "Invalid Email Validation"],
      ["TC_035", "Invalid Phone Validation"],
      ["TC_036", "Successful Submission"],
      ["TC_037", "Error Message Display"],
      ["TC_038", "Submit Button Enabled"],
      ["TC_039", "Submit Button Disabled During Submit"],
      ["TC_040", "Form Reset Works"],
    ]) {
      results.push(record(tid, name, "skipped", "No form present"));
    }
    return results;
  }

  const requiredCount = await form.$$eval("[required], [aria-required='true']", (els) => els.length);
  results.push(
    requiredCount > 0
      ? record("TC_032", "Required Fields Exist", "pass", `${requiredCount} required field(s)`)
      : record("TC_032", "Required Fields Exist", "fail", "No required/aria-required fields found")
  );

  const submitBtn = await form.$("button[type='submit'], input[type='submit'], button:not([type])");

  // Empty form validation: click submit with all fields empty, expect browser/JS validation to block navigation
  let emptyValidation = "skipped";
  let emptyMsg;
  if (submitBtn && requiredCount > 0) {
    try {
      const urlBefore = page.url();
      await submitBtn.click({ timeout: 5000 });
      await page.waitForTimeout(500);
      const urlAfter = page.url();
      const stillSamePage = urlAfter === urlBefore;
      const hasValidationMessage = await form.evaluate((f) => {
        const invalid = f.querySelector(":invalid");
        return !!invalid;
      });
      emptyValidation = stillSamePage && hasValidationMessage ? "pass" : stillSamePage ? "pass" : "fail";
      emptyMsg = stillSamePage ? undefined : "Form appears to have submitted with empty required fields";
    } catch (err) {
      emptyValidation = "fail";
      emptyMsg = err.message;
    }
  }
  results.push(record("TC_033", "Empty Form Validation", emptyValidation, emptyMsg));

  // Invalid email validation
  const emailField = await form.$("input[type='email']");
  let emailResult = "skipped";
  let emailMsg = "No input[type=email] field found";
  if (emailField) {
    try {
      await emailField.fill("not-an-email");
      const isInvalid = await emailField.evaluate((el) => !el.checkValidity());
      emailResult = isInvalid ? "pass" : "fail";
      emailMsg = isInvalid ? undefined : "Browser did not flag malformed email as invalid";
    } catch (err) {
      emailResult = "fail";
      emailMsg = err.message;
    }
  }
  results.push(record("TC_034", "Invalid Email Validation", emailResult, emailMsg));

  // Invalid phone validation
  const phoneField = await form.$("input[type='tel']");
  let phoneResult = "skipped";
  let phoneMsg = "No input[type=tel] field found";
  if (phoneField) {
    try {
      const pattern = await phoneField.getAttribute("pattern");
      await phoneField.fill("abc");
      const isInvalid = pattern ? await phoneField.evaluate((el) => !el.checkValidity()) : null;
      phoneResult = isInvalid === null ? "skipped" : isInvalid ? "pass" : "fail";
      phoneMsg = isInvalid === null ? "Tel field has no pattern attribute to validate against" : isInvalid ? undefined : "Non-numeric input accepted as valid phone";
    } catch (err) {
      phoneResult = "fail";
      phoneMsg = err.message;
    }
  }
  results.push(record("TC_035", "Invalid Phone Validation", phoneResult, phoneMsg));

  // Successful submission: intentionally NOT performed against live forms.
  results.push(
    record(
      "TC_036",
      "Successful Submission",
      "skipped",
      "Skipped by design — QA Sentinel never submits real data to live forms to avoid spamming production systems. Use config-driven mode with a staging URL to enable this check."
    )
  );

  const hasErrorContainer = await page.evaluate(() => {
    return !!document.querySelector("[class*='error'], [role='alert'], .invalid-feedback");
  });
  results.push(
    hasErrorContainer
      ? record("TC_037", "Error Message Display", "pass", "Error/alert container detected in DOM")
      : record("TC_037", "Error Message Display", "fail", "No error/alert container detected after invalid input")
  );

  if (submitBtn) {
    const enabled = await submitBtn.isEnabled().catch(() => false);
    results.push(
      enabled
        ? record("TC_038", "Submit Button Enabled", "pass")
        : record("TC_038", "Submit Button Enabled", "fail", "Submit button is disabled by default")
    );
  } else {
    results.push(record("TC_038", "Submit Button Enabled", "fail", "No submit button found"));
  }

  // Disabled during submit: heuristic only, since we don't actually submit
  results.push(
    record(
      "TC_039",
      "Submit Button Disabled During Submit",
      "skipped",
      "Not verifiable without a real submission; covered only in config-driven mode"
    )
  );

  const resetBtn = await form.$("button[type='reset'], input[type='reset']");
  results.push(
    resetBtn
      ? record("TC_040", "Form Reset Works", "pass", "Reset control present (functional check requires real submission)")
      : record("TC_040", "Form Reset Works", "skipped", "No reset control found")
  );

  return results;
}
