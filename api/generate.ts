import type { IncomingMessage, ServerResponse } from 'http';

interface ExtendedRequest extends IncomingMessage {
  body?: {
    messages?: Array<{ role: string; content: string }>;
    temperature?: number;
    promptType?: string;
  };
  headers: Record<string, string | string[] | undefined>;
}

interface ExtendedResponse extends ServerResponse {
  status: (code: number) => ExtendedResponse;
  json: (data: unknown) => ExtendedResponse;
  setHeader: (name: string, value: string | number | readonly string[]) => this;
}

// In-memory rate limiting map for serverless execution: 60 requests per minute per IP
const ipRateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimits.get(ip);

  if (!entry || now > entry.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (entry.count >= 60) {
    return false;
  }

  entry.count++;
  return true;
}

export default async function handler(req: ExtendedRequest, res: ExtendedResponse): Promise<void> {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({ error: 'Rate limit exceeded. Try again in 60 seconds.' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'GROQ_API_KEY not configured on server' });
    return;
  }

  // Parse body if stream
  let bodyData = req.body;
  if (!bodyData) {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      bodyData = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      res.status(400).json({ error: 'Invalid JSON request payload' });
      return;
    }
  }

  const { messages, temperature = 0.7 } = bodyData || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Missing required messages array' });
    return;
  }

  // Hard 3000ms timeout per Decision #015
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      res.status(groqResponse.status).json({
        error: `Groq upstream error ${groqResponse.status}`,
        details: errorText
      });
      return;
    }

    const data = await groqResponse.json();
    res.status(200).json(data);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Groq upstream request timed out (>3000ms)' : 'Internal Proxy Error',
      message: err instanceof Error ? err.message : String(err)
    });
  }
}
