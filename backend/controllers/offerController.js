const Offer = require("../models/Offer");

// ADMIN - CREATE OFFER
const createOffer = async (req, res) => {
  try {
    const offer = await Offer.create(req.body);
    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL OFFERS
const getOffers = async (req, res) => {
  const offers = await Offer.find({ isActive: true });
  res.json(offers);
};

module.exports = { createOffer, getOffers };