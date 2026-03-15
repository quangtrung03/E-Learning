/**
 * Escape special regex characters in a string to prevent NoSQL/regex injection.
 * @param {string} str - Raw user input
 * @returns {string} String safe to use inside new RegExp()
 */
function escapeRegex(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = { escapeRegex };
