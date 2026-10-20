# Migração Sites Menos Custo → Cakto

O site atual tem **35 SKUs**: 30 modelos individuais e cinco pacotes. O arquivo `cakto-checkouts.json` já contém todos os IDs, mas os links públicos reais da Cakto ainda precisam ser preenchidos.

## Como concluir

1. Na Cakto, abra **Produtos → Ver links** (ou **Produto → Links**) e copie **o link de checkout da oferta**, não a URL do painel de administração.
2. Preencha `checkouts` em `cakto-checkouts.json` com o URL de cada SKU. Cada checkout precisa corresponder ao produto/ZIP exato; não reaproveite um link para entregas diferentes.
3. Configure a entrega de cada ZIP na Cakto para que só seja liberado após aprovação do pagamento.
4. Crie/ative na Cakto o cupom privado **PRIMEIRA10**, com **10%** restrito às duas ofertas P10 (R$ 997 → R$ 897,30), e então altere `coupon_primeira10_enabled` para `true`.
5. Faça o commit na branch `main`. O fluxo GitHub Actions `publish-cakto-checkouts.yml` testa a migração e atualiza o arquivo ZIP de produção **somente se todas as 35 URLs estiverem presentes e válidas**.

## Comportamento após ativação

- O catálogo fica intacto, com compra individual por modelo/pacote.
- O botão de pagamento leva diretamente à URL oficial `pay.cakto.com.br`, com rastreamento da origem.
- A caixa de cupom continua discreta. Se o usuário inserir `PRIMEIRA10` em P10, o código vai à Cakto por `?coupon=PRIMEIRA10`.
- Não aparece chave Pix manual, exigência de comprovante por e-mail nem a antiga etapa 'Já paguei'.
- A Cakto processa o pagamento. Entrega de ZIP e recebimentos **precisam ser configurados e verificados na própria Cakto**; o site não comprova pagamento.

**Status atual:** código e teste automatizado preparados, mas o ZIP publicado ainda não foi alterado porque faltam as 35 URLs e confirmação do cupom na Cakto.

**Segurança:** nunca coloque token de API, senha, credencial do painel, informação bancária ou segredo neste JSON. Use apenas links públicos de checkout.
