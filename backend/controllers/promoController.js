// Promo code database / rules dictionary
const PROMO_CODES = {
  SPLITGO50: { discountPercent: 50, maxDiscount: 50, description: '50% off up to ₹50' },
  WELCOME20: { discountPercent: 20, maxDiscount: 30, description: '20% off up to ₹30' },
  FREEPOOL: { discountPercent: 100, maxDiscount: 40, description: '100% off up to ₹40' },
};

// POST /api/promo/validate -> Validate promo code and calculate discount
exports.validatePromo = async (req, res) => {
  try {
    const { code, fare } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Promo code is required' });
    }

    const uppercaseCode = code.trim().toUpperCase();
    const promo = PROMO_CODES[uppercaseCode];

    if (!promo) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    const estimatedFare = parseFloat(fare) || 0;
    let discount = (estimatedFare * promo.discountPercent) / 100;
    if (discount > promo.maxDiscount) {
      discount = promo.maxDiscount;
    }

    discount = Math.round(discount);
    const finalFare = Math.max(0, estimatedFare - discount);

    res.json({
      valid: true,
      code: uppercaseCode,
      discount,
      finalFare,
      description: promo.description,
      message: `🎉 Code '${uppercaseCode}' applied! You save ₹${discount}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
