import { json, LoaderFunctionArgs } from '@remix-run/node';
import { taquiGenerator } from '../.server/taquiGenerator';
import path from 'path';
export async function loader ({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const text = url.searchParams.get('text');
  
  if (!text) {
    return json({ error: '?text é obrigatório' }, { status: 400 });
  }

  const imageBuffer = await taquiGenerator(text)

  return new Response(imageBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline',
    },
  });
};