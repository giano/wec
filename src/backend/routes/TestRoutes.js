var express = require('express');
var router = express.Router();
var TestController = require('../controllers/TestController.js');

/*
 * GET
 */
router.get('/', TestController.list);

/*
 * GET
 */
router.get('/:id', TestController.show);

/*
 * POST
 */
router.post('/', TestController.create);

/*
 * PUT
 */
router.put('/:id', TestController.update);

/*
 * DELETE
 */
router.delete('/:id', TestController.remove);

module.exports = router;
