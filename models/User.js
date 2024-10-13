const mongoose=require("mongoose")

const schema=mongoose.Schema(
    {
        "user_name":{type: String, required:true},
        "user_password":{type: String, required:true}
    }
)

let userModel=mongoose.model("user",schema)
module.exports={userModel}