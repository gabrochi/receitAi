# Receita IA 🍳 (versão Python/Flask)

Mesmo projeto de antes, agora com backend em **Python + Flask** em vez de Node.js.
O frontend (HTML/CSS/JS) continua igual — isso é inevitável, pois é o que roda no navegador.

## Como rodar

1. **Crie um ambiente virtual (recomendado)**
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```

2. **Instale as dependências**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure sua chave da API do Gemini**
   - Copie `.env.example` para `.env`
   - Pegue uma chave gratuita em https://aistudio.google.com/apikey
   - Cole no arquivo `.env`:
     ```
     GEMINI_API_KEY=sua_chave_aqui
     ```

4. **Rode o servidor**
   ```bash
   python server.py
   ```

5. **Acesse**: abra `http://localhost:3000` no navegador.
   - No celular (mesma rede Wi-Fi), acesse `http://SEU_IP_LOCAL:3000` para poder usar a câmera.
   - Em produção (deploy), o navegador só libera a câmera em conexões HTTPS.

## Estrutura do projeto

```
receita-ia-py/
├── server.py           # Backend Flask, chama a API do Gemini
├── requirements.txt
├── .env.example
└── public/
    ├── index.html       # Interface (3 etapas: foto, ingredientes, receitas)
    ├── style.css
    └── app.js           # Lógica do frontend (fetch para o backend Flask)
```

## Diferenças em relação à versão Node.js

- `express` → `Flask`
- `multer` (upload de arquivo) → `request.files` nativo do Flask
- `fetch` nativo do Node → biblioteca `requests`
- Mesma API do Gemini, mesmos endpoints (`/api/identificar` e `/api/receitas`),
  mesmo contrato JSON — então o frontend não precisou mudar nada.

## Aviso importante para produção

O `app.run(debug=True)` usado aqui é só pra desenvolvimento. Se for colocar em produção,
troque por um servidor WSGI de verdade, por exemplo:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:3000 server:app
```
(no Windows, use `waitress` no lugar do gunicorn)

## Próximos passos sugeridos

- **Cache/histórico**: salvar receitas favoritas (SQLite via `sqlite3` nativo do Python, ou SQLAlchemy)
- **Autenticação**: Flask-Login se for virar produto multiusuário
- **Ajuste fino de prompt**: testar com fotos reais de despensa/geladeira
- **Deploy**: Render, Railway ou Fly.io suportam Python/Flask facilmente
- **Custo**: monitore o uso da API do Gemini — o tier gratuito tem limite de requisições/dia
