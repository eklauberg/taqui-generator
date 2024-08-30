import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import useNotification from "../hooks/useNotification";

export const meta: MetaFunction = () => {
  return [
    { title: "Taqui Generator" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [buttonText, setButtonText] = useState<string>('Copiar');
  const [text, setText] = useState('')
  const showNotification = useNotification();

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
      setButtonText('Copiado!');
      setTimeout(() => {
          setButtonText('Copiar');
      }, 2000);
      showNotification("Imagem copiada para o clipboard!");
    } catch (error) {
      console.error("Erro ao copiar a imagem: ", error);
    }
  }

  return (
    <div className="flex w-full justify-center min-h-screen p-4">
      <div className="flex flex-col items-center w-full max-w-md">
      <div className="mb-2">
        <img src="/assets/taqui-a-logo.png" alt="Tá aqui Generator" className="w-auto m-auto" />
      </div>
      <div className="flex w-full my-4 gap-4">
        <input
          type="text"
          name="text"
          value={text}
          onChange={(v) => setText(v.target.value)}
          placeholder="Digite aqui o contexto"
          required
          className="w-full p-3 text-2xl border-[3px] border-black rounded-md focus:outline-none focus:shadow-[3px_3px_0px_0px_#000000] transition-shadow duration-200"
        />
        <button
          onClick={handleClick}
          className="py-3 px-6 text-2xl text-black font-bold rounded-md bg-[#FFE500] hover:bg-[#FFF129] hover:shadow-[3px_3px_0px_0px_#000000] active:bg-[#FFE500] active:shadow-[3px_3px_0px_0px_#000000] border-[3px] border-black transition duration-200 focus:outline-none"
        >
          Gerar
        </button>
      </div>
      {imageUrl && (
        <div className="mt-4 flex flex-col items-center max-w-md gap-4">
          <img
            id="npm-install"
            src={imageUrl}
            alt="Imagem gerada"
            className="w-full border border-gray-300 rounded-md shadow-sm"
          />
          <button
            onClick={copy}
            className="py-3 px-6 text-2xl text-black font-bold bg-[#FFE500] hover:bg-[#FFF129] hover:shadow-[3px_3px_0px_0px_#000000] active:bg-[#FFE500] active:shadow-[3px_3px_0px_0px_#000000] rounded-md border-[3px] border-black transition duration-200 focus:outline-none"
          >
            {buttonText}
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
