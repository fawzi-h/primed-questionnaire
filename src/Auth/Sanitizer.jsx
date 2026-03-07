// utils/sanitizer.js
import DOMPurify from "dompurify";

/**
 * Sanitizes input to prevent XSS (Cross-Site Scripting) attacks.
 *
 * This function checks if the input is a string, and if so,
 * it uses DOMPurify to sanitize the input. If the input is
 * not a string (e.g., an object or array), it returns the
 * input as is.
 *
 * @param {string|any} input - The input to sanitize.
 * @returns {string|any} - The sanitized input if it was a string;
 *                        otherwise, the original input.
 */

export const sanitizeInput = (input) => {
  // Check if the input is a string
  if (typeof input === "string") {
    // Sanitize the input using DOMPurify
    return DOMPurify.sanitize(input);
  }
  return input;
};
