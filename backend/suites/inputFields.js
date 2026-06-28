// Suite 7: Input Field Tests
export const id = "inputFields";
export const label = "Input Fields";

export async function run(page, url, helpers) {
  const { record } = helpers;
  const results = [];

  // Find all text-like inputs
  const inputs = await page.$$("input[type='text'], input[type='search'], input[type='email'], input[type='tel'], input:not([type])");

  if (inputs.length === 0) {
    for (const [tid, name] of [
      ["TC_041", "Text Input Accepts Valid Data"],
      ["TC_042", "Text Input Rejects Invalid Data"],
      ["TC_043", "Character Limit Works"],
      ["TC_044", "Special Characters Handled"],
      ["TC_045", "Copy Paste Works"],
    ]) {
      results.push(record(tid, name, "skipped", "No text input fields found on page"));
    }
    return results;
  }

  const input = inputs[0];

  // TC_041: Accepts valid data
  try {
    await input.fill("Hello World");
    const val = await input.inputValue();
    results.push(
      val === "Hello World"
        ? record("TC_041", "Text Input Accepts Valid Data", "pass")
        : record("TC_041", "Text Input Accepts Valid Data", "fail", `Expected 'Hello World', got '${val}'`)
    );
  } catch (err) {
    results.push(record("TC_041", "Text Input Accepts Valid Data", "fail", err.message));
  }

  // TC_042: Rejects invalid data (check via pattern/type constraint)
  try {
    const emailInput = await page.$("input[type='email']");
    if (emailInput) {
      await emailInput.fill("not-valid");
      const invalid = await emailInput.evaluate((el) => !el.checkValidity());
      results.push(
        invalid
          ? record("TC_042", "Text Input Rejects Invalid Data", "pass", "Email field correctly rejects non-email input")
          : record("TC_042", "Text Input Rejects Invalid Data", "fail", "Email field accepted invalid input without flagging")
      );
    } else {
      results.push(record("TC_042", "Text Input Rejects Invalid Data", "skipped", "No input[type=email] to test rejection against"));
    }
  } catch (err) {
    results.push(record("TC_042", "Text Input Rejects Invalid Data", "fail", err.message));
  }

  // TC_043: Character limit (maxlength attribute)
  try {
    const limitedInput = await page.$("input[maxlength]");
    if (limitedInput) {
      const maxLen = parseInt(await limitedInput.getAttribute("maxlength"), 10);
      const longStr = "A".repeat(maxLen + 10);
      await limitedInput.fill(longStr);
      const val = await limitedInput.inputValue();
      results.push(
        val.length <= maxLen
          ? record("TC_043", "Character Limit Works", "pass", `maxlength=${maxLen} enforced correctly`)
          : record("TC_043", "Character Limit Works", "fail", `Input accepted ${val.length} chars, maxlength is ${maxLen}`)
      );
    } else {
      results.push(record("TC_043", "Character Limit Works", "skipped", "No input with maxlength attribute found"));
    }
  } catch (err) {
    results.push(record("TC_043", "Character Limit Works", "fail", err.message));
  }

  // TC_044: Special characters handled
  try {
    await input.fill("");
    await input.fill("<script>alert('xss')</script> & \"quotes\" 'apostrophe'");
    const val = await input.inputValue();
    const accepted = val.length > 0;
    results.push(
      accepted
        ? record("TC_044", "Special Characters Handled", "pass", "Special characters accepted in input without crash")
        : record("TC_044", "Special Characters Handled", "fail", "Input rejected or cleared special characters unexpectedly")
    );
  } catch (err) {
    results.push(record("TC_044", "Special Characters Handled", "fail", err.message));
  }

  // TC_045: Copy paste works (simulate via fill which mimics paste)
  try {
    await input.fill("");
    const pasteText = "Pasted content 123";
    await input.fill(pasteText);
    const val = await input.inputValue();
    results.push(
      val === pasteText
        ? record("TC_045", "Copy Paste Works", "pass", "Programmatic fill (simulating paste) accepted correctly")
        : record("TC_045", "Copy Paste Works", "fail", `Expected '${pasteText}', got '${val}'`)
    );
  } catch (err) {
    results.push(record("TC_045", "Copy Paste Works", "fail", err.message));
  }

  // Clean up — clear the input we were testing
  await input.fill("").catch(() => {});

  return results;
}