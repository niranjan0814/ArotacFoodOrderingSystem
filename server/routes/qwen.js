const express = require('express');
const OpenAI = require('openai');
const router = express.Router();

const QWEN_API_KEY = process.env.QWEN_API_KEY; // Store in backend .env

const openai = new OpenAI({
  apiKey: QWEN_API_KEY,
  baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
});

router.post('/recipes', async (req, res) => {
  try {
    const { model, input } = req.body;
    if (!QWEN_API_KEY) {
      return res.status(500).json({ message: 'Qwen AI API key is missing' });
    }
    if (!model || !input || !input.prompt) {
      return res.status(400).json({ message: 'Invalid request: model and input.prompt are required' });
    }
    console.log('Proxying Qwen AI request:', req.body);

    const completion = await openai.chat.completions.create({
      model: model || 'qwen-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant specializing in generating detailed recipes.' },
        { role: 'user', content: input.prompt },
      ],
      max_tokens: 1500, // Limit response to 1500 tokens
    });

    console.log('Qwen AI response:', completion);
    let recipeText = completion.choices[0]?.message?.content || 'No recipe generated.';
    
    // Sanitize recipe text: remove unwanted symbols and artifacts
    recipeText = recipeText
      .replace(/#+[A-Za-z0-9]*$/g, '') // Remove patterns like ##### or #####St5AblthPi
      .replace(/#+$/g, '') // Remove standalone #####
      .replace(/[^\x20-\x7E\n\r]/g, '') // Remove non-printable characters
      .trim(); // Remove leading/trailing whitespace

    res.json({
      recipe: recipeText,
    });
  } catch (err) {
    console.error('Qwen AI API error:', err.message, err.response?.data);
    res.status(err.response?.status || 500).json({
      message: err.response?.data?.message || 'Failed to generate recipe.',
    });
  }
});

module.exports = router;