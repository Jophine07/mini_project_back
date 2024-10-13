const mongoose=require("mongoose")
const bookingSchema = mongoose.Schema(
    {
    name: String,
    email: String,
    phone: String,
    date: String,
    timeSlot: String,
    addOns: [String],
  }
);
let turfmodel =mongoose.model("Turfs",bookingSchema)
module.exports={turfmodel}