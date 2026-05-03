import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenerativeAI } from '@google/genai'

interface ParseRequest {
  transcript: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { transcript } = req.body as ParseRequest

    if (!transcript) {
      return res.status(400).json({ error: 'Missing transcript' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' })
    }

    // TODO: Parse the transcript to extract medication/symptom info
    // For now, return a basic parse

    res.json({
      type: 'unknown',
      text: transcript,
    })
  } catch (error) {
    console.error('Parse-log endpoint error:', error)
    res.status(500).json({ error: 'Failed to parse log entry' })
  }
}
