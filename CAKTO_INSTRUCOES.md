# Sites Menos Custo — pagamentos oficiais pela Cakto

## Estado da integração (20/10/2026)

- Os 35 produtos do catálogo têm checkouts **diferentes**, fornecidos pelo proprietário da loja e registrados em `cakto-checkouts.json`.
- O código do checkout está no arquivo `Sites_Menos_Custo_REPOSITORIO_PARA_RENDER.zip`; a publicação no GitHub foi feita por `publish-cakto-checkouts.yml`.
- O fluxo de compra do site agora permite um item por compra; o botão abre o checkout de seu respectivo SKU na Cakto (com `utm_source=sitesmenoscusto`).
- O site não processa pagamentos e não solicita comprovante; os meios de pagamento e a confirmação ficam na Cakto.
- O site **não garante entrega automática de ZIP**. Isso exige que o conteúdo correto esteja configurado na área de entrega do produto correspondente na Cakto.
- O Google Drive da Sites Menos Custo possui 35 pastas com seus ZIPs, mas as permissões de acesso por link **não foram habilitadas nem verificadas**. Não publique links dos arquivos sem controle de acesso.

## Cupom privado PRIMEIRA10

O cupom de 10% é destinado somente a P10-01 (Biblioteca para Agências) e P10-02 (Negócios em Expansão), reduzindo R$ 997 para R$ 897,30. A Cakto aceita `?coupon=PRIMEIRA10` na URL do checkout, mas **o cupom ainda não foi verificado dentro do painel Cakto**.

Por segurança `coupon_primeira10_enabled` permanece `false` em `cakto-checkouts.json`, e o frontend não mostra nem simula desconto. Confirme as duas ofertas na Cakto antes de reabilitá-lo.

Referência: https://ajuda.cakto.com.br/pt-br/articles/61-como-usar-a-url-para-criar-um-checkout-pre-preenchido-na-cakto

## Manutenção e publicação

- Os checkouts estão em `cakto-checkouts.json`; nunca insira senhas, tokens de API ou dados bancários neste arquivo público.
- O arquivo `apply_cakto_checkout.py` migra o ZIP de publicação para Cakto, com validações dos 35 links.
- `verify-cakto-storefront.yml` confere todos os links publicados, inspeciona o JavaScript e sincroniza o HTML em `storefront-public-index.html`.
- A hospedagem da loja no Render depende da configuração do serviço e do build automático. **Uma atualização do GitHub não comprova por si só que o Render concluiu seu deploy.** Conferir separadamente no painel Render.
