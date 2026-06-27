const { generateChatResponse } = require('../services/geminiService');

/**
 * POST /api/chat
 * Send a message to the NGO chatbot
 */
const sendChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      const error = new Error('Message is required');
      error.statusCode = 400;
      return next(error);
    }

    const reply = await generateChatResponse(message.trim());

    res.status(200).json({
      success: true,
      message: 'Chat response generated successfully',
      data: { reply },
    });
  } catch (error) {
    res.status(500).json({
        success: false,
        message: error.message
    });
}
};

module.exports = { sendChatMessage };
