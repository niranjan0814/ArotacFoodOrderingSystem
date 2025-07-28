import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    verifyOtp :{type:String,default:''},
    verifyOtpExpireAt :{type:Number,default:0},
    isAccountVerified :{type:Boolean,default:false},
    resetOtp :{type:String,default:''},
    resetOtpExpireAt :{type:Number,default:0},
    profilePhoto: { type: String, default: '' },  // This can store the URL or path of the profile photo
    address: { type: String, default: '' },       // This can store the user's address
    phoneNumber: { type: String, default: '' },   // This can store the user's phone number
})

const userModel = mongoose.models.user || mongoose.model("user",userSchema);
export default userModel