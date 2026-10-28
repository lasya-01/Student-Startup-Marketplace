const express = require("express");
const supabase = require("../supabase");
const { requireAuth } = require("../middleware/auth");
const { validateListing } = require("../utils/validate");

const router = express.Router();

// GET /api/listings — view active listings
router.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ listings: data });
  } catch (error) {
    next(error);
  }
});

// POST /api/listings — create a listing
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const result = validateListing(req.body || {});

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const { data, error } = await supabase
      .from("listings")
      .insert({
        ...result.value,
        seller_id: req.user.id
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ listing: data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/listings/:id — edit your own listing
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid listing ID." });
    }

    const result = validateListing(req.body || {});

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const { data, error } = await supabase
      .from("listings")
      .update(result.value)
      .eq("id", id)
      .eq("seller_id", req.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: "Listing not found or not yours."
      });
    }

    res.json({ listing: data });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/listings/:id — delete your own listing
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid listing ID." });
    }

    const { data, error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id)
      .eq("seller_id", req.user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: "Listing not found or not yours."
      });
    }

    res.json({ message: "Listing deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;