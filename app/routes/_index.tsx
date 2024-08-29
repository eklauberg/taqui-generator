import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Taqui Generator" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [text, setText] = useState('')

  const handleClick = () => {
    if (text && text.trim().length > 0) {
      setImageUrl(`/api/generate-image?text=${text}`)
    }
  }

  const copy = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const clipboardItem = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([clipboardItem]);

      alert("Imagem copiada para o clipboard!");
    } catch (error) {
      console.error("Erro ao copiar a imagem: ", error);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tá aqui Generator</h1>
      <input
        type="text"
        name="text"
        value={text}
        onChange={(v) => setText(v.target.value)}
        placeholder="Digite o texto"
        required
        className="w-full max-w-md p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleClick}
        className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200"
      >
        Gerar Imagem
      </button>
      {imageUrl && (
        <div className="mt-6 flex flex-col items-center">
          <img
            id="npm-install"
            src={imageUrl}
            alt="Imagem gerada"
            className="w-full max-w-md border border-gray-300 rounded-md shadow-sm"
          />
          <button
            onClick={copy}
            className="mt-4 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors duration-200"
          >
            Copiar
          </button>
        </div>
      )}
    </div>
  );
}
