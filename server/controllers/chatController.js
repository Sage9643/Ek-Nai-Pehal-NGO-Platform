const { generateChatResponse } = require('../services/geminiService');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * POST /api/chat
 * Send a message to the NGO chatbot
 */
const sendChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const reply = await generateChatResponse(message.trim());

    sendSuccess(res, {
      message: 'Chat response generated successfully',
      data: { reply },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendChatMessage };
