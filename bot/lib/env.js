// Read settings from Vercel's environment, trimming stray spaces / Windows line endings that sneak in when pasting.
module.exports = function env() {
  const out = {};
  for (const [k, v] of Object.entries(process.env)) out[k] = typeof v === "string" ? v.trim() : v;
  return out;
};
