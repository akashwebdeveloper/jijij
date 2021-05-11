require('dotenv').config();
const User = require('../../models/user')
const multer = require('multer');
fs = require('fs')
const BASE_URL = process.env.BASE_URL;
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/users');
    },
    filename: function (req, file, cb) {
        cb(null, `${req.body.phone}` + '.' + file.originalname.split(".")[1]);
    }
});

const upload = multer({
    storage: storage,
});


module.exports = {
    updatephoto: (req, res, next) => {

        const { phone } = req.body
        const extention = req.file.originalname.split('.').pop();
        const fileName = `${phone}.${extention}`;

        User.findOneAndUpdate({ phone: phone }, { $set: { photos: fileName } }, function (err, result) {
            if (err) {
                console.log(err);
                return res.status(202).json({
                    success: false,
                    status: 202,
                    message: "err from database",
                    error: err
                });
            }

            if (!result) {
                return res.status(202).json({
                    success: false,
                    status: 202,
                    message: "user not available with this Phone Number"
                });
            } else {
                // Deleting file
                var deletePhoto = `./public/images/users/${result.photos}`;

                if (fs.existsSync(deletePhoto)) {
                    fs.unlink(deletePhoto, function (err) {
                        if (err) console.log(err);
                        console.log('file deleted successfully');
                    })
                }


                User.findById(result._id, function (err, docs) {
                    if (err) throw err;
                    
                    // returning successfully after updating photo
                    return res.status(200).json({
                        success: true,
                        status: 200,
                        message: "Created product successfully",
                        photourl: `${BASE_URL}/images/users/${docs.photos}`
                    });
                })
            }
        });
    },
    upload
}