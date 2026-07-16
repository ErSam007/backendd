import express from 'express';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text = "" } = req.body;
    const textLower = text.toLowerCase();

    // 1. Extract Amount via regex
    const amountPattern = /(?:rs\.?|₹|\$)?\s*(\d+(?:\.\d{1,2})?)/i;
    const matches = textLower.match(amountPattern);
    const amount = matches ? parseFloat(matches[1]) : null;

    // 2. Classify Category via keywords
    let category = "Others";
    if (['lunch', 'dinner', 'breakfast', 'burger', 'pizza', 'food', 'canteen', 'starbucks', 'coffee', 'tea', 'cafe'].some(w => textLower.includes(w))) {
      category = "Food";
    } else if (['bus', 'metro', 'cab', 'uber', 'ola', 'train', 'travel', 'transport', 'ticket'].some(w => textLower.includes(w))) {
      category = "Transport";
    } else if (['book', 'notebook', 'stationery', 'exam', 'education', 'course', 'library'].some(w => textLower.includes(w))) {
      category = "Books";
    } else if (['movie', 'ticket', 'game', 'party', 'entertainment', 'club', 'concert'].some(w => textLower.includes(w))) {
      category = "Entertainment";
    } else if (['recharge', 'phone', 'wifi', 'internet', 'bill'].some(w => textLower.includes(w))) {
      category = "Recharge";
    } else if (['doctor', 'medicine', 'pill', 'hospital', 'medical', 'clinic'].some(w => textLower.includes(w))) {
      category = "Medical";
    }

    // 3. Extract description by removing amount numbers
    let description = textLower;
    if (amount !== null) {
      // Remove match sequence from description
      description = textLower.replace(matches[0], "").trim();
      // Remove common prefix verbs like "log", "spent", "paid", "spent "
      description = description.replace(/^(log|spent|paid|for|on|bought)\s+/i, "");
    }
    
    if (!description) {
      description = "Voice transaction";
    } else {
      // Capitalize first letter
      description = description.charAt(0).toUpperCase() + description.slice(1);
    }

    res.json({
      success: amount !== null,
      amount,
      category,
      description
    });
  } catch (err) {
    console.error("Error in Node Voice-Parse route:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
