const router = require('express').Router();
const { signup } = require('../controller/auth/phoneController')

// const { oneUser, multiUser } = require('../controller/notify')
// const { getalldata, getdata, update, emailverification} = require('../controller/users/users')
const { getdata, update} = require('../controller/users/users')
// const { follow, unfollow } = require('../controller/users/followController')
const { updatephoto, upload } = require('../controller/photos/profilephoto')
const { testing, Squad, upcoming } = require('../controller/matches/matchAPI')   
const { openContestList, createTeam, teamList, joinContest, updateTeam, contestDetails } = require('../controller/matches/contest')   
// const { free, appexclusive, accessories, apparel, electronics, food_beverage, footwear, health_wellness, jewellery, personalcare, sleepsolution, subscription, others } = require('../controller/bazar/bannerController')
// const { addbookmark, removebookmark, bookmarklist } = require('../controller/bazar/bookmarkController')
// const { like, unlike } = require('../controller/bazar/likeController')
// const { productfullview } = require('../controller/bazar/fullviewController')


// Insert New User into database
router.post('/signup', signup)

// get data from database
router.post('/getinfo', getdata)
// router.get('/getalluser', getalldata)

// // router.post('/oneuser', oneUser)
// // router.post('/multiuser', multiUser)



// // Update user data
router.post('/updateprofile', update)
router.post('/updatephoto', upload.single('photos'), updatephoto)

// // just for testing
// router.post('/emailverification', emailverification)





// // Banner data getting
// router.post('/bannerfree', free)
// router.post('/bannerappexclusive', appexclusive)
// router.post('/banneraccessories', accessories)
// router.post('/bannerapparel', apparel)
// router.post('/bannerelectronics', electronics)
// router.post('/bannerfood_beverage', food_beverage)
// router.post('/bannerfootwear', footwear)
// router.post('/bannerhealth_wellness', health_wellness)
// router.post('/bannerjewellery', jewellery)
// router.post('/bannerpersonalcare', personalcare)
// router.post('/bannersleepsolution', sleepsolution)
// router.post('/bannersubscription', subscription)
// router.post('/bannerothers', others)


// // Banner Full view data
// router.post('/productinfo', productfullview)


// // Bookmarks
// router.post('/addbookmark', addbookmark)
// router.post('/removebookmark', removebookmark)
// router.post('/bookmarklist', bookmarklist)

// // Likes
// router.post('/like', like)
// router.post('/unlike', unlike)

// // Follow & follwers
// router.post('/follow', follow)
// router.post('/unfollow', unfollow)


router.get('/testing', testing)
router.post('/squad', Squad)
router.get('/upcomingmatch', upcoming)

router.post('/opencontestlist', openContestList)
router.post('/create_team', createTeam)
router.post('/team_list', teamList)
router.post('/join_contest', joinContest)
router.post('/update_team', updateTeam)
router.post('/contest_details', contestDetails)




module.exports = router;