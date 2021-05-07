const User = require('../../models/user')

module.exports = {
    usertable: (req, res) => {
        try {
            var query = {};
            var page = 1;
            var perpage = 10;
            if (req.query.page != null) {
                page = req.query.page
            }
            query.skip = (perpage * page) - perpage;
            query.limit = perpage;
            //    getting data in limit for pagination
            User.find({ type: { $ne: 'admin' }}, {}, query, (err, data) => {
                if (err) {
                    console.log(err);
                }
                User.estimatedDocumentCount((err, count) => {
                    if (err) {
                        console.log(err)
                    }
                    return res.render('usertable', {
                        data: data,
                        current: page,
                        pages: Math.ceil(count / perpage),
                        page_name: 'table',
                        perpage
                    })
                });
            });
        } catch (error) {
            console.log(error);
        }
    }
}