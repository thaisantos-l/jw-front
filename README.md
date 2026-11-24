# JW US Invest — frontend

Next.js App Router, React, TypeScript e SCSS Modules, com exportação estática e atualização editorial em runtime. CMS: [jw-csm](https://github.com/thaisantos-l/jw-csm).

## Executar localmente

Requisitos: Node.js 24.22.3+ da série 24 e pnpm 12.23.0. O WordPress/WAMP deve estar ativo.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

No PowerShell, use `Copy-Item .env.example .env.local` somente quando ainda não existir uma configuração local. Revisão: http://127.0.0.1:3001/.

```sh
pnpm check
pnpm build
pnpm verify:export
pnpm preview
```

Preview estático: http://127.0.0.1:4174/. `build` gera `out/` e um manifesto com hashes; não publica nada. O build usa uma captura consistente do CMS e um diretório temporário próprio em `.cache/`, separado do servidor de desenvolvimento. O export anterior é preservado em `.cache/` quando substituído. Cache e outputs não são versionados.

## Conteúdo e funcionamento

Textos, mídias, imóveis, FAQ, menus e contatos vêm dos campos do CMS. `src/lib/jw-home.graphql` corresponde à operação `JWHome` do plugin JW Core. O endpoint público é derivado de `WORDPRESS_GRAPHQL_URL`, preservando o subdiretório do WAMP; nenhuma credencial é passada ao navegador.

O HTML inicial é a captura do build. Após hidratar, a página consulta a API versionada a cada 5 segundos enquanto visível, também ao recuperar foco/conexão. Em condições normais, alterações aparecem em até 10 segundos, sem novo build/deploy. ETag evita transferir conteúdo igual. Erros de rede ou envelopes inválidos preservam a última página válida; os dados do formulário não são reinicializados a cada atualização. Sem JavaScript, o conteúdo é a captura inicial e o formulário fica desabilitado.

As rotas `/privacidade/` e `/termos/` estão preparadas; os links só aparecem com páginas publicadas e preenchidas. Metadados SEO, sitemap e HTML inicial refletem o build. Não há SSR ou promessa de atualização instantânea de SEO numa hospedagem estática.

`SITE_URL` define a origem para canonical/sitemap. `SITE_INDEXABLE=false` mantém o ambiente local fora de indexação. Domínio e configuração de produção ficam para a publicação posterior.

## Design e fontes

Origem: [Figma JW, frame 57:3](https://www.figma.com/design/DAML6reLloLGruZ9qcCRDs/?node-id=57-3). Textos e fotos foram importados para a Biblioteca de mídia do WordPress. Assets decorativos originais são locais em `public/icons/`; não existem URLs temporárias do Figma no runtime. Sora e Inter são servidas localmente, com licenças incluídas. Tons acessíveis de dourado são usados em textos pequenos e botões.

A seleção e ordem dos imóveis pertencem à Home; cadastros possuem URL opcional. Não existem páginas de detalhes de imóveis nesta entrega. “Agendar uma conversa” envia uma mensagem, sem serviço de agendamento externo.

Testes, relatórios, capturas, fixtures, builds, `.env.local` e credenciais ficam fora do Git. Nenhum arquivo de produto depende dessas evidências. **Deploy não configurado nem executado.**
