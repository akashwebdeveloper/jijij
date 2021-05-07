const {auth} = require('../middleware/auth')
const {guest} = require('../middleware/guest')
const { createContest, addContest, contestList } = require('../controller/admin/contestController')   

const router = require('express').Router();
const { login, postLogin, logout  } = require('../controller/admin/authController')
const { home } = require('../controller/admin/homeController')
const { usertable } = require('../controller/admin/userController')

router.get('/', auth, home)
// router.get('/', home)s
router.get('/login',guest , login)
// router.get('/login', login)
router.post('/login', postLogin)
router.get('/logout', logout)

router.get('/create_contest',auth , createContest)
router.post('/create_contest', addContest)

router.get('/contest_table',auth , contestList)

module.exports = router;