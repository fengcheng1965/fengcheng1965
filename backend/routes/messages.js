const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken, requireStaff } = require('../middleware/auth');

router.post('/', messageController.createMessage);
router.use(authenticateToken);
router.get('/', requireStaff, messageController.getMessages);
router.get('/stats', requireStaff, messageController.getMessageStats);
router.get('/:id', requireStaff, messageController.getMessageById);
router.put('/:id/reply', requireStaff, messageController.replyMessage);
router.put('/:id/status', requireStaff, messageController.updateMessageStatus);
router.delete('/:id', requireStaff, messageController.deleteMessage);

module.exports = router;
