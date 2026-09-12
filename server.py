import os
import json

from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
import requests

load_dotenv()

app = Flask(__name__, static_folder="public", static_url_path="")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-3.6-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


def call_gemini(parts, json_mode=True):
    """Chama a API do Gemini e retorna o texto de resposta (já validado)."""
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY não configurada. Copie .env.example para .env e adicione sua chave."
        )

    body = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {
            **({"responseMimeType": "application/json"} if json_mode else {}),
            "thinkingConfig": {"thinkingLevel": "low"},
        },
    }

    resp = requests.post(
        GEMINI_URL,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
        },
        data=json.dumps(body),
        timeout=60,
    )

    if not resp.ok:
        raise RuntimeError(f"Erro na API do Gemini ({resp.status_code}): {resp.text}")

    data = resp.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise RuntimeError("Resposta vazia ou inesperada da API do Gemini.")

    return text


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/identificar", methods=["POST"])
def identificar():
    if "foto" not in request.files:
        return jsonify({"erro": "Nenhuma imagem enviada."}), 400

    foto = request.files["foto"]
    image_bytes = foto.read()

    import base64
    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    mime_type = foto.mimetype or "image/jpeg"

    prompt = """Analise esta imagem e identifique todos os ingredientes culinários visíveis
(vegetais, temperos, condimentos, ácidos como limão/vinagre, proteínas, laticínios, etc).

Responda APENAS com um JSON válido, sem markdown, sem texto extra, no formato:
{
  "ingredientes": [
    {"nome": "cebola", "quantidade_estimada": "1 unidade média", "confianca": "alta"}
  ]
}

Se não conseguir identificar algo com certeza, ainda assim inclua com confianca "baixa".
Se a imagem não tiver nenhum ingrediente reconhecível, retorne ingredientes como lista vazia."""

    parts = [
        {"text": prompt},
        {"inlineData": {"mimeType": mime_type, "data": base64_image}},
    ]

    try:
        text_response = call_gemini(parts)
        parsed = json.loads(text_response)
        return jsonify(parsed)
    except Exception as err:
        return jsonify({"erro": str(err)}), 500


@app.route("/api/receitas", methods=["POST"])
def receitas():
    body = request.get_json(silent=True) or {}
    ingredientes = body.get("ingredientes")
    restricoes = body.get("restricoes", "")

    if not ingredientes or not isinstance(ingredientes, list):
        return jsonify({"erro": "Lista de ingredientes vazia."}), 400

    lista_texto = ", ".join(ingredientes)
    restricoes_texto = f"Restrições/preferências do usuário: {restricoes}." if restricoes else ""

    prompt = f"""Com base nestes ingredientes disponíveis: {lista_texto}.
{restricoes_texto}

Sugira até 3 receitas possíveis. Priorize receitas que usem o máximo desses ingredientes,
mas pode assumir itens básicos de despensa (sal, óleo, água, açúcar).

Responda APENAS com um JSON válido, sem markdown, no formato:
{{
  "receitas": [
    {{
      "nome": "Nome da receita",
      "tempo_preparo": "20 minutos",
      "dificuldade": "fácil",
      "ingredientes_usados": ["cebola", "alho"],
      "ingredientes_faltantes": ["carne moída"],
      "modo_preparo": ["Passo 1...", "Passo 2..."]
    }}
  ]
}}"""

    try:
        text_response = call_gemini([{"text": prompt}])
        parsed = json.loads(text_response)
        return jsonify(parsed)
    except Exception as err:
        return jsonify({"erro": str(err)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=True)
