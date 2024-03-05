import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFilesOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File successfully uploaded", response.url);
    //check the file exist or not before unlinking
    if (fs.existsSync(localFilePath)) {
      //unlink after success
      fs.unlinkSync(localFilePath);
      console.log("File unlink after success", localFilePath);
    } else
      console.warn(
        "Local file not found for unlink after success",
        localFilePath
      );

    return response;
  } catch (error) {
    //check file exist or not before unlink after failure
    if (fs.existsSync(localFilePath)) {
      //unlink after failure
      fs.unlinkSync(localFilePath);
    } else {
      console.warn("file not foun for unlink after failure", localFilePath);
    }
    return null;
  }
};

export { uploadFilesOnCloudinary };
