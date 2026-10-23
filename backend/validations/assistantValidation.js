const Joi = require('joi');

const messageSchema = Joi.object({
  role: Joi.string().valid('user', 'assistant').required(),
  content: Joi.string().trim().min(1).max(500).required()
}).unknown(false);

const assistantRequestSchema = Joi.object({
  messages: Joi.array().items(messageSchema).min(1).max(8).required().custom((messages, helpers) => {
    const totalLength = messages.reduce((sum, message) => sum + message.content.length, 0);
    if (totalLength > 2400 || messages[messages.length - 1].role !== 'user') {
      return helpers.error('array.invalidConversation');
    }
    return messages;
  }).messages({
    'array.invalidConversation': 'La conversación es demasiado extensa o debe terminar con una pregunta.'
  })
}).unknown(false);

module.exports = { assistantRequestSchema };
