const OrderRequest = require("../models/OrderRequest");
const Order = require("../models/Order");

const getMyRequests = async (req, res) => {
  const requests = await OrderRequest.find({
deliveryPartner: req.partner._id,
    status: "Pending"
  }).populate("order");

  res.json(requests);
};

const acceptRequest = async (req, res) => {
  const request = await OrderRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });

  const order = await Order.findById(request.order);

  if (order.deliveryPartner) {
    return res.status(400).json({ message: "Order already assigned" });
  }

  order.deliveryPartner = request.deliveryPartner;
  order.status = "Assigned";
  await order.save();

  request.status = "Accepted";
  await request.save();

  await OrderRequest.updateMany(
    { order: order._id, _id: { $ne: request._id } },
    { status: "Rejected" }
  );

  res.json({ message: "Order assigned to you", order });
};

module.exports = { getMyRequests, acceptRequest };