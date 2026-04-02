"""
Broto — Serviço NotebookLM
Wrapper FastAPI sobre notebooklm-py para integrar o Google NotebookLM ao Broto.

Endpoints:
  POST /notebook/create       → Cria notebook para uma turma
  POST /notebook/add-source   → Adiciona material (URL ou arquivo) a um notebook
  POST /notebook/chat         → Chat do aluno com materiais da turma
  POST /routine/generate      → Gera rotina de estudo personalizada via IA

Pré-requisito:
  Rodar `notebooklm login` uma vez no servidor para autenticar via browser.
"""

import json
import logging
import os
import tempfile
import base64
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, Field
from notebooklm import NotebookLMClient

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("broto-notebooklm")

SERVICE_SECRET = os.getenv("SERVICE_SECRET", "")
NOTEBOOK_MAP_PATH = Path(os.getenv("NOTEBOOK_MAP_PATH", "./data/notebook_map.json"))

# ---------------------------------------------------------------------------
# Estado global — mapeamento class_id → notebook_id
# ---------------------------------------------------------------------------


def _load_notebook_map() -> dict[str, str]:
    """Carrega mapeamento class_id → notebook_id do disco."""
    if NOTEBOOK_MAP_PATH.exists():
        return json.loads(NOTEBOOK_MAP_PATH.read_text())
    return {}


def _save_notebook_map(mapping: dict[str, str]) -> None:
    """Persiste mapeamento no disco."""
    NOTEBOOK_MAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    NOTEBOOK_MAP_PATH.write_text(json.dumps(mapping, indent=2))


notebook_map: dict[str, str] = {}

# ---------------------------------------------------------------------------
# Cliente NotebookLM (singleton async)
# ---------------------------------------------------------------------------

_client: Optional[NotebookLMClient] = None


async def get_client() -> NotebookLMClient:
    """Retorna cliente autenticado. Levanta erro claro se não autenticado."""
    global _client
    if _client is None:
        try:
            _client = await NotebookLMClient.from_storage()
            await _client.__aenter__()
        except Exception as e:
            _client = None
            logger.error("Falha ao criar cliente NotebookLM: %s", e)
            raise HTTPException(
                status_code=503,
                detail=(
                    "Sessão do NotebookLM não encontrada ou expirada. "
                    "Execute 'notebooklm login' no servidor para autenticar."
                ),
            ) from e
    return _client


# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    global notebook_map
    notebook_map = _load_notebook_map()
    logger.info("Notebook map carregado com %d entradas", len(notebook_map))
    yield
    # Cleanup: fechar client se existir
    global _client
    if _client is not None:
        try:
            await _client.__aexit__(None, None, None)
        except Exception:
            pass


app = FastAPI(
    title="Broto NotebookLM Service",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Auth middleware simples
# ---------------------------------------------------------------------------


def _verify_secret(authorization: Optional[str] = Header(None)):
    """Valida SERVICE_SECRET se configurado."""
    if not SERVICE_SECRET:
        return  # Sem secret = sem auth (dev local)
    if authorization != f"Bearer {SERVICE_SECRET}":
        raise HTTPException(status_code=401, detail="Não autorizado")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class CreateNotebookRequest(BaseModel):
    class_id: str = Field(..., description="ID da turma no Supabase")
    class_name: str = Field(..., description="Nome da turma (usado como título do notebook)")


class CreateNotebookResponse(BaseModel):
    notebook_id: str
    class_id: str
    message: str


class AddSourceRequest(BaseModel):
    class_id: str = Field(..., description="ID da turma")
    source_type: str = Field(
        "url",
        description="Tipo de fonte: 'url', 'text', 'file' (base64)"
    )
    url: Optional[str] = Field(None, description="URL do material (se source_type='url')")
    text: Optional[str] = Field(None, description="Texto do material (se source_type='text')")
    file_data: Optional[str] = Field(None, description="Arquivo em base64 (se source_type='file')")
    file_name: Optional[str] = Field(None, description="Nome do arquivo (se source_type='file')")
    title: Optional[str] = Field(None, description="Título opcional do material")


class AddSourceResponse(BaseModel):
    success: bool
    message: str


class ChatRequest(BaseModel):
    class_id: str = Field(..., description="ID da turma (para encontrar o notebook)")
    question: str = Field(..., description="Pergunta do aluno")
    user_id: Optional[str] = Field(None, description="ID do aluno (para log)")


class ChatResponse(BaseModel):
    answer: str
    class_id: str


class RoutineRequest(BaseModel):
    class_id: str = Field(..., description="ID da turma")
    user_id: str = Field(..., description="ID do aluno")
    hours_per_day: float = Field(..., description="Horas disponíveis por dia")
    exam_date: str = Field(..., description="Data do ENEM (YYYY-MM-DD)")
    performance: dict = Field(
        default_factory=dict,
        description=(
            "Desempenho por área. Ex: "
            '{"linguagens": {"accuracy": 0.6, "weak_topics": ["interpretação"]}, ...}'
        ),
    )


class RoutineResponse(BaseModel):
    routine: dict
    message: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_notebook_id(class_id: str) -> str:
    """Busca notebook_id pelo class_id. Levanta 404 se não encontrado."""
    nb_id = notebook_map.get(class_id)
    if not nb_id:
        raise HTTPException(
            status_code=404,
            detail=f"Nenhum notebook encontrado para a turma '{class_id}'. Crie primeiro via POST /notebook/create.",
        )
    return nb_id


ROUTINE_PROMPT_TEMPLATE = """\
Você é um assistente educacional especializado em preparação para o ENEM.
Com base nos materiais desta turma e nos dados do aluno abaixo, gere uma rotina de estudo semanal personalizada.

DADOS DO ALUNO:
- Horas disponíveis por dia: {hours_per_day}h
- Data do ENEM: {exam_date}
- Desempenho por área:
{performance_text}

REGRAS PARA A ROTINA:
1. Segunda a sexta: estudo focado, priorizando áreas com menor acurácia
2. Sábado: revisão geral dos pontos fracos da semana
3. Domingo: descanso
4. Distribua as 4 áreas ao longo da semana, dando mais tempo às mais fracas
5. Para cada dia, indique: área de foco, tópicos específicos, tempo sugerido

Responda APENAS com um JSON válido no formato:
{{
  "week": [
    {{
      "day": "segunda",
      "area": "Ciências Humanas",
      "topics": ["Geografia política", "História do Brasil"],
      "hours": 2.0,
      "tip": "Foque em questões de 2019-2023 sobre esse tema"
    }}
  ],
  "summary": "Resumo da estratégia em 1-2 frases"
}}
"""


def _format_performance(perf: dict) -> str:
    """Formata dicionário de performance para o prompt."""
    if not perf:
        return "  (sem dados de desempenho disponíveis)"
    lines = []
    for area, data in perf.items():
        acc = data.get("accuracy", "?")
        weak = ", ".join(data.get("weak_topics", [])) or "nenhum identificado"
        lines.append(f"  - {area}: acurácia {acc}, tópicos fracos: {weak}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.post("/notebook/create", response_model=CreateNotebookResponse)
async def create_notebook(req: CreateNotebookRequest, authorization: Optional[str] = Header(None)):
    """Cria um notebook no NotebookLM para uma turma."""
    _verify_secret(authorization)

    # Se já existe, retorna o existente
    if req.class_id in notebook_map:
        return CreateNotebookResponse(
            notebook_id=notebook_map[req.class_id],
            class_id=req.class_id,
            message="Notebook já existia para esta turma.",
        )

    client = await get_client()
    try:
        nb = await client.notebooks.create(f"Broto — {req.class_name}")
        notebook_map[req.class_id] = nb.id
        _save_notebook_map(notebook_map)
        logger.info("Notebook criado: %s → %s", req.class_id, nb.id)
        return CreateNotebookResponse(
            notebook_id=nb.id,
            class_id=req.class_id,
            message="Notebook criado com sucesso.",
        )
    except Exception as e:
        logger.error("Erro ao criar notebook: %s", e)
        raise HTTPException(status_code=502, detail=f"Erro no NotebookLM: {e}") from e


@app.post("/notebook/add-source", response_model=AddSourceResponse)
async def add_source(req: AddSourceRequest, authorization: Optional[str] = Header(None)):
    """Adiciona material (URL, texto ou arquivo) ao notebook da turma."""
    _verify_secret(authorization)

    nb_id = _get_notebook_id(req.class_id)
    client = await get_client()

    try:
        if req.source_type == "url":
            if not req.url:
                raise HTTPException(status_code=400, detail="Campo 'url' obrigatório para source_type='url'")
            await client.sources.add_url(nb_id, req.url, wait=False)
            return AddSourceResponse(success=True, message=f"URL enviada para indexação: {req.url}")

        elif req.source_type == "text":
            if not req.text:
                raise HTTPException(status_code=400, detail="Campo 'text' obrigatório para source_type='text'")
            await client.sources.add_text(nb_id, req.text, title=req.title or "Material de texto")
            return AddSourceResponse(success=True, message="Texto adicionado como fonte.")

        elif req.source_type == "file":
            if not req.file_data or not req.file_name:
                raise HTTPException(
                    status_code=400,
                    detail="Campos 'file_data' (base64) e 'file_name' obrigatórios para source_type='file'",
                )
            # Decodifica base64, salva em temp, envia ao NotebookLM
            file_bytes = base64.b64decode(req.file_data)
            suffix = Path(req.file_name).suffix or ".pdf"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name
            try:
                await client.sources.add_file(nb_id, tmp_path, wait=False)
            finally:
                os.unlink(tmp_path)
            return AddSourceResponse(success=True, message=f"Arquivo '{req.file_name}' adicionado.")

        else:
            raise HTTPException(status_code=400, detail=f"source_type inválido: '{req.source_type}'")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Erro ao adicionar fonte: %s", e)
        raise HTTPException(status_code=502, detail=f"Erro no NotebookLM: {e}") from e


@app.post("/notebook/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, authorization: Optional[str] = Header(None)):
    """Chat do aluno — faz pergunta ao NotebookLM com base nos materiais da turma."""
    _verify_secret(authorization)

    nb_id = _get_notebook_id(req.class_id)
    client = await get_client()

    try:
        result = await client.chat.ask(nb_id, req.question)
        logger.info("Chat [turma=%s, aluno=%s]: %s...", req.class_id, req.user_id, req.question[:50])
        return ChatResponse(answer=result.answer, class_id=req.class_id)
    except Exception as e:
        logger.error("Erro no chat: %s", e)
        raise HTTPException(status_code=502, detail=f"Erro no NotebookLM: {e}") from e


@app.post("/routine/generate", response_model=RoutineResponse)
async def generate_routine(req: RoutineRequest, authorization: Optional[str] = Header(None)):
    """Gera rotina de estudo semanal via chat com o NotebookLM."""
    _verify_secret(authorization)

    nb_id = _get_notebook_id(req.class_id)
    client = await get_client()

    prompt = ROUTINE_PROMPT_TEMPLATE.format(
        hours_per_day=req.hours_per_day,
        exam_date=req.exam_date,
        performance_text=_format_performance(req.performance),
    )

    try:
        result = await client.chat.ask(nb_id, prompt)
        # Tenta parsear JSON da resposta
        answer = result.answer.strip()
        # Remove possíveis blocos markdown
        if answer.startswith("```"):
            answer = answer.split("\n", 1)[1] if "\n" in answer else answer
        if answer.endswith("```"):
            answer = answer.rsplit("```", 1)[0]
        answer = answer.strip()

        try:
            routine_data = json.loads(answer)
        except json.JSONDecodeError:
            # Se não parseou, retorna como texto livre
            logger.warning("Resposta da rotina não é JSON válido, retornando como texto")
            routine_data = {"raw_response": answer, "week": [], "summary": ""}

        return RoutineResponse(routine=routine_data, message="Rotina gerada com sucesso.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Erro ao gerar rotina: %s", e)
        raise HTTPException(status_code=502, detail=f"Erro no NotebookLM: {e}") from e


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    """Verifica se o serviço está rodando e autenticado."""
    authenticated = False
    try:
        client = await get_client()
        # Tenta listar notebooks como teste de conexão
        await client.notebooks.list()
        authenticated = True
    except Exception:
        pass

    return {
        "status": "ok" if authenticated else "degraded",
        "authenticated": authenticated,
        "notebooks_mapped": len(notebook_map),
    }
