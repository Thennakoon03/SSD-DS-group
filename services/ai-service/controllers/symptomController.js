import axios from 'axios';
import SymptomCheck from '../models/SymptomCheck.js';

const GITHUB_AI_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';
const MODEL = 'gpt-4o-mini';

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are MediCheck, an AI-powered medical symptom analysis assistant for a healthcare platform.
When a patient describes their symptoms, you must respond ONLY with a valid JSON object (no markdown, no extra text) using exactly this structure:

{
  "symptomsAnalyzed": ["symptom 1", "symptom 2"],
  "possibleConditions": [
    {
      "name": "Condition Name",
      "likelihood": "high | moderate | low",
      "description": "Brief description of this condition and why it matches the symptoms."
    }
  ],
  "recommendedSpecialties": ["General Practitioner", "Cardiologist"],
  "urgencyLevel": "routine | soon | urgent | emergency",
  "generalAdvice": "Practical advice the patient should follow right now.",
  "disclaimer": "This is not a medical diagnosis. Please consult a qualified healthcare professional."
}

Rules:
- List 2-4 possible conditions, ordered from most to least likely.
- urgencyLevel: 'emergency' = life-threatening (chest pain, stroke signs); 'urgent' = see doctor today; 'soon' = within a few days; 'routine' = scheduled appointment.
- recommendedSpecialties: suggest 1-3 relevant doctor specialties.
- Be concise and professional.
- NEVER recommend specific medications or dosages.
- Always include the disclaimer.`;

// ── POST /api/ai/symptom-check ────────────────────────────────────────────────
export const checkSymptoms = async (req, res) => {
  try {
    const { symptoms, age, gender } = req.body;
    const patientId = req.user?.id;

    if (!symptoms || symptoms.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please describe your symptoms in more detail.' });
    }

    // Build user message
    let userMessage = `Patient symptoms: ${symptoms.trim()}`;
    if (age)    userMessage += `\nPatient age: ${age}`;
    if (gender) userMessage += `\nPatient gender: ${gender}`;

    // Call GitHub AI
    const aiResponse = await axios.post(
      GITHUB_AI_ENDPOINT,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userMessage },
        ],
        temperature: 0.4,
        max_tokens:  1024,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUBTOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const rawContent = aiResponse.data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      return res.status(502).json({ success: false, message: 'AI service returned an empty response.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return res.status(502).json({ success: false, message: 'AI response could not be parsed.', raw: rawContent });
    }

    // Save to DB if patient is authenticated
    let saved = null;
    if (patientId) {
      saved = await SymptomCheck.create({
        patientId,
        symptoms: symptoms.trim(),
        age:    age    || undefined,
        gender: gender || undefined,
        symptomsAnalyzed:       parsed.symptomsAnalyzed       || [],
        possibleConditions:     parsed.possibleConditions     || [],
        recommendedSpecialties: parsed.recommendedSpecialties || [],
        urgencyLevel:           parsed.urgencyLevel           || 'routine',
        generalAdvice:          parsed.generalAdvice          || '',
        disclaimer:             parsed.disclaimer             || '',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: saved?._id,
        ...parsed,
      },
    });
  } catch (err) {
    console.error('[AI] checkSymptoms error:', err?.response?.data || err.message);
    if (err?.response?.status === 401) {
      return res.status(502).json({ success: false, message: 'GitHub AI token is invalid or expired.' });
    }
    if (err?.response?.status === 429) {
      return res.status(429).json({ success: false, message: 'AI rate limit reached. Please try again shortly.' });
    }
    return res.status(500).json({ success: false, message: 'AI service error. Please try again.' });
  }
};

// ── GET /api/ai/symptom-check/history ────────────────────────────────────────
export const getHistory = async (req, res) => {
  try {
    const patientId = req.user?.id;
    if (!patientId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const history = await SymptomCheck.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({ success: true, data: history });
  } catch (err) {
    console.error('[AI] getHistory error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch history.' });
  }
};

// ── DELETE /api/ai/symptom-check/:id ─────────────────────────────────────────
export const deleteCheck = async (req, res) => {
  try {
    const patientId = req.user?.id;
    const { id } = req.params;

    const check = await SymptomCheck.findOneAndDelete({ _id: id, patientId });
    if (!check) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    return res.status(200).json({ success: true, message: 'Deleted.' });
  } catch (err) {
    console.error('[AI] deleteCheck error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to delete.' });
  }
};
