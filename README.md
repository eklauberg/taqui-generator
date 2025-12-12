# Táqui Generator

O **Táqui Generator** é uma aplicação web construída com **React Router (framework)** + **Vite** + **Tailwind CSS**, que permite gerar imagens com texto personalizado no estilo "Tá aqui", com base em uma imagem de fundo. Basta inserir o texto desejado, clicar em "Gerar" e copiar a imagem para compartilhar.

## Funcionalidades

- **Inserção de Texto Personalizado**: Digite o texto que você deseja exibir na imagem.
- **Geração de Imagem**: Clique no botão "Gerar" para criar a imagem com o texto inserido.
- **Cópia Fácil**: Use o botão "Copiar" para copiar a imagem gerada para a área de transferência.

## Captura de Tela

![Táqui Generator Screenshot](./screenshot.png)

## Como Usar

1. Clone o repositório:
    ```bash
    git clone https://github.com/seuusuario/taqui-generator.git
    cd taqui-generator
    ```
2. Instale as dependências usando Bun:
    ```bash
    bun install
    ```
3. Inicie o servidor de desenvolvimento:
    ```bash
    bun run dev
    ```
4. Abra o navegador e acesse a URL exibida no terminal (geralmente `http://localhost:5173`).

## Build e Produção

```bash
bun run build
bun run start
```

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do repositório.
2. Crie uma nova branch com sua feature (`git checkout -b minha-feature`).
3. Commit suas alterações (`git commit -am 'Adicionei uma nova feature'`).
4. Envie suas alterações para a branch (`git push origin minha-feature`).
5. Crie um Pull Request.
