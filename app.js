const express=require("express")
const mongoose=require("mongoose")
const cors=require("cors")
const router=express.Router()
const bcrypt=require("bcryptjs")
const jwt = require('jsonwebtoken')
const {adminModel}=require("./models/Admin")
const { userModel } = require("./models/User")
const { turfmodel } = require("./models/Turf")
const { Order } = require("./models/Order")


const app=express()
app.use(cors())
app.use(express.json())

const generateHashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

mongoose.connect("mongodb+srv://jophine:jophinepaul@cluster0.oyyvgui.mongodb.net/TurfDB?retryWrites=true&w=majority&appName=Cluster0")

app.post("/adminSignUp",async(req,res)=>
{
    let input=req.body
    let hashedpassword=await generateHashPassword(input.admin_password)
    console.log(hashedpassword)
    input.admin_password=hashedpassword
    let admin=new adminModel(input)
    admin.save()
    res.json({"Status":"Saved"})
})

app.post('/addturf', async (req, res) => {
    try {
        // Check if the required fields are present
        const { date, timeSlot } = req.body;

        if (!date || !timeSlot) {
            return res.status(400).json({ message: 'Date and time slot are required.' });
        }

        // Check if the date is in the past
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set today's date to midnight for accurate comparison

        if (selectedDate < today) {
            return res.status(400).json({ message: 'The booking date cannot be in the past.' });
        }

        // Check if the time slot is already booked
        const existingBooking = await turfmodel.findOne({ date, timeSlot });
        
        if (existingBooking) {
            return res.status(400).json({ message: 'This time slot is already booked. Please choose another time.' });
        }

        // Create a new booking
        const newBooking = new turfmodel(req.body);
        await newBooking.save();

        res.status(200).json({ message: 'Booking successful' });
    } catch (error) {
        console.error(error); // Log the error
        res.status(500).json({ message: 'Error booking turf' });
    }
});

app.post('/cancelbooking', async (req, res) => {
  const { bookingId } = req.body;
  try {
      // Assuming you want to mark the booking as cancelled, you could update a field or remove it
      const response = await turfmodel.findByIdAndDelete(bookingId);
      
      if (response) {
          res.json({ status: 'success' });
      } else {
          console.log(bookingId)
          res.json({ status: 'error', message: 'Booking not found.' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Error processing cancellation.' });
  }
});


app.post("/recent-booking", async (req, res) => {
  try {
    const { username } = req.body;
    const recentBooking = await turfmodel.find({ name: username })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .limit(1); // Limit the results to the most recent booking
    res.json(recentBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving booking.' });
  }
});


app.post('/bookinghistory', async (req, res) => {
    const { username } = req.body;  // Extract username from request body

    // Log the incoming username for debugging

    try {
      // Fetch booking history based on the username
      const bookings = await turfmodel.find({ name: username });

      // Log the fetched bookings for debugging
      // Check if bookings were found
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({ message: 'No bookings found for this user.' });
      }

      // Send the bookings in the response
      res.status(200).json(bookings);
    } catch (error) {
      // Log the error for debugging
      console.error('Error retrieving booking history:', error);
      res.status(500).json({ message: 'Error retrieving booking history.' });
    }
});




app.post("/userSignUp",async(req,res)=>
{
    let input=req.body
    let hashedpassword=await generateHashPassword(input.user_password)
    console.log(hashedpassword)
    input.user_password=hashedpassword
    let user=new userModel(input)
    user.save()
    res.json({"status":"Saved"})
})


app.post("/userLogin", async (req, res) => {
    let input = req.body;
    userModel.find({ "user_name": req.body.user_name }).then((response) => {
        if (response.length > 0) {
            let dbuserPassword = response[0].user_password;
            bcrypt.compare(input.user_password, dbuserPassword, (error, isMatch) => {
                if (isMatch) {
                    // Generate JWT token with the user's name as the payload
                    const token = jwt.sign({ user_name: response[0].user_name }, 'your_secret_key', { expiresIn: '1d' });
                    
                    // Send the token back to the frontend
                    res.json({
                        status: "login success",
                        token: token,  // Token sent to the frontend
                        user_name: response[0].user_name // Include the user name if needed
                    });
                } else {
                    res.json({ status: "incorrect" });
                }
            });
        } else {
            res.json({ status: "User Not Found" });
        }
    });
});


app.post("/adminLogin",async(req,res)=>
{
    let input=req.body
    adminModel.find({"admin_name":req.body.admin_name}).then(
        (response)=>{
            if(response.length>0)
                {
                    let dbAdminPassword=response[0].admin_password
                    bcrypt.compare(input.admin_password,dbAdminPassword,(error,isMatch)=>
                    {
                        if(isMatch)
                            {
                                res.json({"status":"login success"})
                            }
                        else
                        {
                            res.json({ "status": "incorrect" })

                        }
                    })
                }
                else
                {
                    res.json({ "status": "User Not Found" })

                }
        }
    )
})



app.post('/api/orders/create-order', async (req, res) => {
    try {
      const { user, items } = req.body;
  
      // Log the incoming order data for debugging
      console.log('Order received:', { user, items });
  
      // Validate the required fields
      if (!user || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Invalid order data' });
      }
  
      // Calculate total price from the items array
      const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  
      // Create a new order
      const newOrder = new Order({
        user,
        items,
        totalPrice
      });
  
      // Save the order to the database
      await newOrder.save();
  
      // Send a success response
      res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Failed to place the order. Please try again later.' });
    }
  });



//admin controls

app.get('/bookings', (req, res) => {
    try {
        turfmodel.find().then(
            (data => {
                res.json(data)
            })
        )
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });


  app.get('/vieworders',(req,res)=>{
    try{
        Order.find().then(
            (data=>{
                res.json(data)
            })
        )
    }catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Failed to fetch bookings' });
      }
    });


  app.post("/delete", (req, res) => {
    let input = req.body
    turfmodel.findOneAndDelete(input.name)
      .then((response) => {
        if (response) {
          res.json({ status: 'success', message: 'Booking deleted successfully.' });
        } else {
          res.status(404).json({ status: 'error', message: 'Booking not found.' });
        }
      })
      .catch((error) => {
        console.error('Error deleting booking:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete the booking.' });
      });
  });


  
  app.post("/deleteorder", (req, res) => {
    const input = req.body; // Extract the name or user from the request body
    console.log('Deleting booking for:', input);
  
    // Make sure 'user' is the correct field name in your model schema
    turfmodel.findOneAndDelete({ user: input.user })
      .then((response) => {
        if (response) {
          res.json({ status: 'success', message: 'Booking deleted successfully.' });
        } else {
          res.status(404).json({ status: 'error', message: 'Booking not found.' });
        }
      })
      .catch((error) => {
        console.error('Error deleting booking:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete the booking.' });
      });
  });
  
  


 app.post("/search",(req,res)=>{
    let input=req.body
    turfmodel.find(input)
    .then(
        (data)=>{
            res.json(data)
        }
    ).catch((error) => {
        res.json(error.message)
    })
 })



app.listen(8080,()=>{
    console.log("Server initiated")
})