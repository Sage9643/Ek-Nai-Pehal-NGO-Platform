const { GoogleGenerativeAI } = require('@google/generative-ai');
const { NGO_CONTEXT } = require('../constants/ngoContext');
const Event = require('../models/Event');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const buildLiveEventsContext = async () => {
  const events = await Event.find().sort({ date: -1 }).limit(20).lean();

  if (!events.length) {
    return `
# LIVE EVENTS DATABASE

No events are currently stored in the database.
`;
  }

  const eventLines = events
    .map((event) => {
      const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      return `- ${event.title} (${event.category}, ${eventDate}): ${event.description}`;
    })
    .join('\n');

  return `
# LIVE EVENTS DATABASE

When users ask about recent events, upcoming events, or specific activities, use ONLY the events listed below from the live database.

${eventLines}
`;
};

/**
 * Generate a chatbot reply using Gemini API.
 * NGO_CONTEXT is injected into every request so the bot stays on-topic.
 */
const generateChatResponse = async (userMessage) => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('Gemini API key is not configured');
    error.statusCode = 500;
    throw error;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const liveEventsContext = await buildLiveEventsContext();

  const prompt = `
${NGO_CONTEXT}

${liveEventsContext}

---
User question: ${userMessage}

Respond as the Ek Nai Pehal NGO assistant. Follow all rules in the context above.
`.trim();

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();

} catch (error) {

    console.error("Gemini Error:", error);

    // Retry once if Gemini is overloaded
    if (error.status === 503) {

        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const retryResult = await model.generateContent(prompt);
            return retryResult.response.text();

        } catch (retryError) {

            console.error("Retry failed:", retryError);

            throw new Error(
                "Pehal AI is currently experiencing high demand. Please try again in a few moments."
            );
        }
    }

    throw new Error(
        "Sorry, Pehal AI is temporarily unavailable. Please try again in a few moments."
    );
}
};

module.exports = { generateChatResponse };
