/**
 * Format test output by fixing line breaks and preserving ANSI color codes
 * @param output Raw output from test execution
 * @returns Formatted output with proper line breaks
 */
export function formatTestOutput(output: string): string {
  // Split the output into lines
  const lines = output.split(/\r?\n/);
  
  // Find the index of the line that indicates the start of Mocha output
  const mochaStartIndex = lines.findIndex(line => line.includes('Running test cases using Mocha'));
  
  // If we found the marker, only keep lines after it, otherwise keep all lines
  const relevantLines = mochaStartIndex !== -1 
    ? lines.slice(mochaStartIndex + 1)  // Skip the "Running test cases" line too
    : lines;
  
  // Filter out empty lines at the beginning
  let startIndex = 0;
  while (startIndex < relevantLines.length && !relevantLines[startIndex].trim()) {
    startIndex++;
  }
  
  // Join the filtered lines with CRLF
  return relevantLines.slice(startIndex).join('\r\n');
}

/**
 * Strip ANSI color codes from text
 * @param text Text with possible ANSI color codes
 * @returns Plain text without color codes
 */
export function stripAnsiCodes(text: string): string {
  const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  return text.replace(ansiRegex, '');
}

/**
 * Converts LF line endings to CRLF
 * @param text Input text that may contain LF line endings
 * @returns Text with CRLF line endings
 */
export function ensureCrLf(text: string): string {
  return text.replace(/\r?\n/g, '\r\n');
}

/**
 * Prepare test output for appendOutput (keeps colors, ensures CRLF)
 * @param output Raw test output
 * @returns Formatted output ready for appendOutput
 */
export function prepareOutputForAppend(output: string): string {
  // Filter logs and ensure CRLF line endings
  const formattedOutput = formatTestOutput(output);
  return `\r\n${formattedOutput}\r\n`;
}

/**
 * Prepare test output for error messages (strips colors, ensures LF)
 * @param output Raw test output
 * @returns Formatted output ready for error messages
 */
export function prepareOutputForErrorMessage(output: string): string {
  // Filter logs, strip ANSI colors, and ensure LF line endings for error messages
  const formattedOutput = formatTestOutput(output);
  const plainOutput = stripAnsiCodes(formattedOutput);
  return plainOutput.replace(/\r\n/g, '\n');
}
