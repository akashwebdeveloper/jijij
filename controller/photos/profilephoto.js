const User = require('../../models/user')
const multer = require('multer');
fs = require('fs')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './profilephoto');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/[\/\\:]/g, "_") + file.originalname);
    }
});

const upload = multer({
    storage: storage,
});


module.exports = {
    updatephoto: (req, res, next) => {

        const { id } = req.body

        //   for replacing slash 
        const invertSlashes = str => {
            let res = '';
            for(let i = 0; i < str.length; i++){
               if(str[i] !== '\\'){
                  res += str[i];
                  continue;
               };
               res += '\/';
            };
            return res;
         };


        User.findOneAndUpdate({ _id: id }, { $set: { photos: `http://52.78.211.221/${invertSlashes(req.file.path)}` || "" } }, function (err, result) {
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
                    message: "user not available with this id"
                });
            } else {
                // Deleting file

                var deletePhoto = (result.photos.substr(('http://13.213.4.147//').length, result.photos.length));
                
                if (fs.existsSync(deletePhoto)) {
                    fs.unlink(deletePhoto, function (err) {
                        if (err) console.log(err);
                        console.log('file deleted successfully');
                    })
                } else {
                    console.log("File does not exist.")
                }


                User.findById(result._id, function (err, docs) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        // returning successfully after updating photo
                        return res.status(200).json({
                            success: true,
                            status: 200,
                            message: "Created product successfully",
                            photourl: docs.photos
                        });
                    }
                })
            }

        });
    },
    upload
}