const CATEGORIES = [
  "Art & Design",
  "Fashion",
  "Tech & Digital",
  "Food & Gifts",
  "Learning",
  "Services"
];

function validateListing(body) {
  const title = String(body.title || "").trim();
  const category = String(body.category || "").trim();
  const description = String(body.description || "").trim();
  const price = Number(body.price);

  if (!title || title.length > 80) {
    return { error: "Title must be 1–80 characters." };
  }

  if (!CATEGORIES.includes(category)) {
    return { error: "Choose a valid category." };
  }

  if (!description || description.length > 500) {
    return { error: "Description must be 1–500 characters." };
  }

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Enter a valid non-negative price." };
  }

  return {
    value: { title, category, description, price }
  };
}

module.exports = { CATEGORIES, validateListing };