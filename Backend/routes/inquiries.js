const express = require("express");
const supabase = require("../supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/inquiries — send an inquiry
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const listingId = Number(req.body?.listing_id);
    const message = String(req.body?.message || "").trim();

    if (!Number.isSafeInteger(listingId) || listingId < 1) {
      return res.status(400).json({
        error: "A valid listing_id is required."
      });
    }

    if (!message || message.length > 1000) {
      return res.status(400).json({
        error: "Message must be 1–1000 characters."
      });
    }

    const { data: listing, error: listingError } =
      await supabase
        .from("listings")
        .select("id, is_active")
        .eq("id", listingId)
        .maybeSingle();

    if (listingError) throw listingError;

    if (!listing || !listing.is_active) {
      return res.status(404).json({
        error: "Active listing not found."
      });
    }

    const { data, error } = await supabase
      .from("inquiries")
      .insert({
        listing_id: listingId,
        buyer_id: req.user.id,
        message
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ inquiry: data });
  } catch (error) {
    next(error);
  }
});

// GET /api/inquiries/sent — inquiries sent by you
router.get("/sent", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .eq("buyer_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ inquiries: data });
  } catch (error) {
    next(error);
  }
});

// GET /api/inquiries/received — messages on your listings
router.get("/received", requireAuth, async (req, res, next) => {
  try {
    const { data: listings, error: listingError } =
      await supabase
        .from("listings")
        .select("id")
        .eq("seller_id", req.user.id);

    if (listingError) throw listingError;

    const ids = (listings || []).map(item => item.id);

    if (ids.length === 0) {
      return res.json({ inquiries: [] });
    }

    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .in("listing_id", ids)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ inquiries: data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;