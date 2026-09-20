# 🛍️ Bazar & Loja da Família (Vitrine + Gestão)

Sistema web completo para bazar e loja familiar (Roupas, Perfumes e Variedades) com expositor online para os clientes e painel administrativo protegido por senha.

## ✨ Recursos

- **Expositor Online (Vitrine Pública):**
  - Catálogo categorizado (Roupas, Perfumes, Bazar & Variedades)
  - Simulação de parcelas (*"ou em até 2x de R$ ..."*)
  - Sacola de compras com envio do pedido pronto para o **WhatsApp**
- **Área da Família (Painel Administrativo):**
  - Senha padrão: `1234`
  - **Controle de Estoque & Produtos:** cálculo automático de margem de lucro % e alerta de estoque baixo
  - **Frente de Caixa (PDV):** vendas rápidas à vista (PIX/dinheiro), cartão e **2x de boca**
  - **Controle de Fiado ("2x de Boca"):** acompanhamento de parcelas com botão de cobrança amigável no WhatsApp
  - **Clientes:** histórico de compras e saldo devedor
  - **Finanças Pessoais:** contas da casa (mercado, luz, água) separadas do caixa da loja
  - **Backup:** exportação e restauração em arquivo `.json`

---

## 🚀 Como Subir para o GitHub e Vercel

### 1. Subir para o GitHub
1. Crie um novo repositório vazio no [GitHub](https://github.com/new) (ex: `sistema-de-loja`).
2. No terminal da pasta do projeto, execute:
```bash
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
git push -u origin main
```

### 2. Publicar na Vercel (Gratuito)
1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **"Add New..."** > **"Project"**.
3. Selecione o repositório do seu bazar e clique em **"Import"**.
4. A Vercel detectará automaticamente a configuração do Vite e o arquivo `vercel.json`.
5. Clique em **"Deploy"**. Em segundos sua loja estará no ar na internet!
