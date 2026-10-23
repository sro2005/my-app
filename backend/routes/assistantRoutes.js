const express = require('express');
const assistantController = require('../controllers/assistantController');
const { limitAssistantRequests } = require('../utils/assistantRateLimit');

const router = express.Router();

router.get('/status', assistantController.getStatus);
router.post('/chat', limitAssistantRequests, assistantController.chat);

module.exports = router;
