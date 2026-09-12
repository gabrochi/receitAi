let fotoSelecionada = null;
let ingredientesAtuais = [];

const inputFoto = document.getElementById("input-foto");
const btnTirarFoto = document.getElementById("btn-tirar-foto");
const btnIdentificar = document.getElementById("btn-identificar");
const previewContainer = document.getElementById("preview-container");
const preview = document.getElementById("preview");
const loadingIdentificar = document.getElementById("loading-identificar");

const etapaIngredientes = document.getElementById("etapa-ingredientes");
const listaIngredientesEl = document.getElementById("lista-ingredientes");
const inputNovoIngrediente = document.getElementById("input-novo-ingrediente");
const btnAdicionar = document.getElementById("btn-adicionar");
const inputRestricoes = document.getElementById("input-restricoes");
const btnBuscarReceitas = document.getElementById("btn-buscar-receitas");
const loadingReceitas = document.getElementById("loading-receitas");

const etapaReceitas = document.getElementById("etapa-receitas");
const listaReceitasEl = document.getElementById("lista-receitas");
const btnRecomecar = document.getElementById("btn-recomecar");

const erroContainer = document.getElementById("erro-container");

function mostrarErro(msg) {
  erroContainer.textContent = "⚠️ " + msg;
  erroContainer.classList.remove("hidden");
  setTimeout(() => erroContainer.classList.add("hidden"), 6000);
}

btnTirarFoto.addEventListener("click", () => inputFoto.click());

inputFoto.addEventListener("change", () => {
  const file = inputFoto.files[0];
  if (!file) return;
  fotoSelecionada = file;
  preview.src = URL.createObjectURL(file);
  previewContainer.classList.remove("hidden");
  btnIdentificar.classList.remove("hidden");
});

btnIdentificar.addEventListener("click", async () => {
  if (!fotoSelecionada) return;

  loadingIdentificar.classList.remove("hidden");
  btnIdentificar.disabled = true;

  try {
    const formData = new FormData();
    formData.append("foto", fotoSelecionada);

    const resp = await fetch("/api/identificar", { method: "POST", body: formData });
    const data = await resp.json();

    if (!resp.ok) throw new Error(data.erro || "Erro ao identificar ingredientes.");

    ingredientesAtuais = (data.ingredientes || []).map(i => ({
      nome: i.nome,
      confianca: i.confianca || "média",
    }));

    renderizarIngredientes();
    etapaIngredientes.classList.remove("hidden");
    etapaIngredientes.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    mostrarErro(err.message);
  } finally {
    loadingIdentificar.classList.add("hidden");
    btnIdentificar.disabled = false;
  }
});

function renderizarIngredientes() {
  listaIngredientesEl.innerHTML = "";
  ingredientesAtuais.forEach((ing, idx) => {
    const li = document.createElement("li");
    if (ing.confianca === "baixa") li.classList.add("confianca-baixa");
    li.innerHTML = `<span>${ing.nome}</span>`;
    const btnRemover = document.createElement("button");
    btnRemover.textContent = "✕";
    btnRemover.addEventListener("click", () => {
      ingredientesAtuais.splice(idx, 1);
      renderizarIngredientes();
    });
    li.appendChild(btnRemover);
    listaIngredientesEl.appendChild(li);
  });
}

btnAdicionar.addEventListener("click", () => {
  const valor = inputNovoIngrediente.value.trim();
  if (!valor) return;
  ingredientesAtuais.push({ nome: valor, confianca: "alta" });
  inputNovoIngrediente.value = "";
  renderizarIngredientes();
});

inputNovoIngrediente.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnAdicionar.click();
});

btnBuscarReceitas.addEventListener("click", async () => {
  if (ingredientesAtuais.length === 0) {
    mostrarErro("Adicione ao menos um ingrediente.");
    return;
  }

  loadingReceitas.classList.remove("hidden");
  btnBuscarReceitas.disabled = true;

  try {
    const resp = await fetch("/api/receitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredientes: ingredientesAtuais.map(i => i.nome),
        restricoes: inputRestricoes.value.trim(),
      }),
    });
    const data = await resp.json();

    if (!resp.ok) throw new Error(data.erro || "Erro ao gerar receitas.");

    renderizarReceitas(data.receitas || []);
    etapaReceitas.classList.remove("hidden");
    etapaReceitas.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    mostrarErro(err.message);
  } finally {
    loadingReceitas.classList.add("hidden");
    btnBuscarReceitas.disabled = false;
  }
});

function renderizarReceitas(receitas) {
  listaReceitasEl.innerHTML = "";
  if (receitas.length === 0) {
    listaReceitasEl.innerHTML = "<p>Nenhuma receita encontrada com esses ingredientes.</p>";
    return;
  }

  receitas.forEach(r => {
    const div = document.createElement("div");
    div.className = "receita";

    const faltantesHtml = (r.ingredientes_faltantes && r.ingredientes_faltantes.length > 0)
      ? `<div class="faltantes">Falta: ${r.ingredientes_faltantes.join(", ")}</div>`
      : "";

    const passosHtml = (r.modo_preparo || []).map(p => `<li>${p}</li>`).join("");

    div.innerHTML = `
      <h3>${r.nome}</h3>
      <div class="meta">⏱️ ${r.tempo_preparo || "—"} · 📊 ${r.dificuldade || "—"}</div>
      ${faltantesHtml}
      <ol>${passosHtml}</ol>
    `;
    listaReceitasEl.appendChild(div);
  });
}

btnRecomecar.addEventListener("click", () => {
  fotoSelecionada = null;
  ingredientesAtuais = [];
  inputFoto.value = "";
  previewContainer.classList.add("hidden");
  btnIdentificar.classList.add("hidden");
  etapaIngredientes.classList.add("hidden");
  etapaReceitas.classList.add("hidden");
  inputRestricoes.value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});
