const { createClient } = require("@supabase/supabase-js");

const authClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      return res.status(401).json({
        error: "Please sign in first."
      });
    }

    const { data, error } =
      await authClient.auth.getUser(match[1]);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Invalid or expired access token."
      });
    }

    req.user = data.user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requireAuth };