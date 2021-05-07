const User = require('../../models/user')
module.exports = {
    home: (req, res) =>{
        // // it will capible with condition
        // User.countDocuments({ type: { $ne: 'admin' }},(err, ucount) => {
        //     if (err) {
        //         console.log(err)
        //     }
        //     // it will not capible with condition
        //     Bazar.estimatedDocumentCount((err, bcount) => {
        //         if (err) {
        //             console.log(err)
        //         }
        //     });
        // });
        
        return res.render('home', {page_name: 'home'})
    }
}