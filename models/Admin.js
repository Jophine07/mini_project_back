const mongoose=require("mongoose")

const admin_schema=mongoose.Schema(
    {
        "admin_name":{type : String,required:true},
        "admin_password":{type : String,required:true}

    }
)
let adminModel=mongoose.model("Admin",admin_schema)
module.exports={adminModel}

