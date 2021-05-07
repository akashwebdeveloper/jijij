const { mapReduce } = require('../../models/contest');
const Contest = require('../../models/contest')
const Subcontest = require('../../models/sub_contest')

module.exports = {
    createContest: (req, res) => {
        return res.render('contestForm', { page_name: 'form' })
    },
    addContest: (req, res) => {
        console.log(req.body);
        const { prize_pool, spot, entry_fee, entry_limit, from, to, ammount } = req.body

        var winner = [];

        for (let i = 0; i < from.length; i++) {
            var pushObj = {
                from: from[i],
                to: to[i],
                ammount: ammount[i]
            };
            winner.push(pushObj)
        }


        const contest = new Contest({
            prizePool: prize_pool,
            spot: spot,
            winner,
            entryFee: entry_fee,
            entryLimit: entry_limit,
        })

        contest.save().then(user => {
            
            
            
            
            // save Contest
            return res.redirect('/admin/create_contest')
        }).catch(err => {
            return res.status(503).json({
                success: 0,
                status: 503,
                message: "err from database",
                err
            })
        })
    },
    contestList: (req, res) => {
        Contest.find({},(err, contests)=>{
            if (err) throw err;
            return res.render('contestTable', {contests : contests})
        })
    },
}