import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, json, useActionData } from "@remix-run/react";
import { useState } from "react";
import useNotification from "../hooks/useNotification";
import { Link } from "../.server/Link";
import { makeLinkRepository } from "../.server/makeLinkRepository";

export const meta: MetaFunction = () => {
    return [
        { title: "Link Generator" },
        { name: "description", content: "Welcome to Remix!" },
    ];
};

type ActionData = {
    shortUrl?: string;
    originalUrl?: string;
    error?: string;
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const originalUrl = formData.get("url");
    const contexto = formData.get("contexto");

    if (!originalUrl) {
        return json({ error: "URL é obrigatória" }, { status: 400 });
    }

    if (!contexto) {
        return json({ error: "URL é obrigatória" }, { status: 400 });
    }


    const shortUrl = Math.random().toString(36).substring(2, 8); // Gerador de URL curta

    const link: Link = { key: shortUrl, contexto: contexto.toString(), url: originalUrl.toString() }
    makeLinkRepository().save(link)

    return json<ActionData>({ shortUrl: shortUrl });
};

export default function Index() {
    const [buttonText, setButtonText] = useState<string>('Copiar');
    const [text, setText] = useState('')
    const [link, setLink] = useState('')
    const showNotification = useNotification();
    const actionData = useActionData<ActionData>()

    const handleClick = () => {
        console.log()
    }

    const copy = async () => {

    }

    return (

        <div className="flex w-full justify-center min-h-screen p-4">
            <div className="flex flex-col items-center w-full max-w-md">
                <div className="mb-2">
                    <img src="/assets/taqui-a-logo.png" alt="Tá aqui Generator" className="w-auto m-auto" />
                </div>
                <Form method="post">
                    <div className="flex flex-col w-full my-4 gap-4">
                        <input
                            type="text"
                            name="contexto"
                            value={text}
                            onChange={(v) => setText(v.target.value)}
                            placeholder="Digite aqui o contexto"
                            required
                            className="w-full p-3 text-2xl border-[3px] border-black rounded-md focus:outline-none focus:shadow-[3px_3px_0px_0px_#000000] transition-shadow duration-200"
                        />
                        <input
                            type="text"
                            name="url"
                            value={link}
                            onChange={(v) => setLink(v.target.value)}
                            placeholder="Digite aqui o link"
                            required
                            className="w-full p-3 text-2xl border-[3px] border-black rounded-md focus:outline-none focus:shadow-[3px_3px_0px_0px_#000000] transition-shadow duration-200"
                        />
                        <button
                            type="submit"
                            className="py-3 px-6 text-2xl text-black font-bold rounded-md bg-[#FFE500] hover:bg-[#FFF129] hover:shadow-[3px_3px_0px_0px_#000000] active:bg-[#FFE500] active:shadow-[3px_3px_0px_0px_#000000] border-[3px] border-black transition duration-200 focus:outline-none"
                        >
                            Encurtar
                        </button>
                    </div>
                </Form>
                {actionData?.shortUrl && (
                    <div>
                        <p>URL Encurtada: <a href={`/teste/${actionData.shortUrl}`}>{`${window.location.origin}/teste/${actionData.shortUrl}`}</a></p>
                    </div>
                )}
            </div>
        </div>
    );
}
