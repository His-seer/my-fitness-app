const GEMINI_API_KEY = "AIzaSyCTjm2_op-C171gatkWLianfc0-8uX2a4A";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export const callGemini = async (prompt: string, schema?: any): Promise<string> => {
  const payload: any = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {}
  };

  if (schema) {
    payload.generationConfig.responseMimeType = "application/json";
    payload.generationConfig.responseSchema = schema;
  }

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();

    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      return result.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Failed to get a valid response from the AI.");
    }
  } catch (error) {
    console.error("Gemini API call error:", error);
    throw error;
  }
};