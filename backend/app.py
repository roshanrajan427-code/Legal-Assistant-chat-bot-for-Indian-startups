import os
from pathlib import Path
from typing import Iterable, Optional

from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import PromptTemplate
from tavily import TavilyClient

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


# ---------------------------------------------------------
# PROMPT
# ---------------------------------------------------------

PROMPT = PromptTemplate.from_template(
    """
You are an Indian startup legal information assistant.

Answer ONLY using information supported by the provided context.

STRICT RULES:

1. First determine whether the context actually answers the user's question.
2. Ignore context that is unrelated to the question.
3. Never combine unrelated legal documents.
4. Never invent or guess a law, section, threshold, date, exemption,
   filing requirement, or regulatory rule.
5. If the context contains conflicting information, say that the sources
   conflict and identify the conflict.
6. If the context does not contain enough information, say:
   "I don't have enough information to answer this reliably."
7. For questions containing "latest", "current", "today", "2026",
   or similar words, prioritize recent official sources.
8. Distinguish between:
   - mandatory requirements
   - conditional requirements
   - optional benefits/exemptions
9. Always explain conditions and exceptions when they affect the answer.
10. Do not treat a general rule as applying to every startup.
11. Do not cite information merely because it appears in the context.
    It must actually answer the question.
12. Prefer Indian government and regulatory sources.
13. Do not make assumptions when information is missing.
14. This is general legal information, not legal advice.
15. Never present a filing or compliance requirement as applicable to every startup
    unless the context explicitly establishes that it applies universally.

16. For each compliance item, state who it applies to and any important condition
    when that information is available.

17. For "latest" or "current" questions, do not claim that the information is
    complete or exhaustive unless the context supports that conclusion.

18. Never say "No conflicting or incomplete information is provided" unless you
    have actually verified that the retrieved sources are sufficient.

19. If the question is broad and the retrieved sources only cover some areas,
    explicitly say that the answer is a high-level overview rather than a
    complete compliance checklist.
20. Do not include software, HRMS tools, automation platforms, or business
    recommendations as legal compliance requirements unless specifically asked.

21. Never state a penalty amount without identifying the applicable law,
    provision/section, and type of default when supported by the context.

22. Do not describe GST, income-tax, audit, filing, employment, or regulatory
    requirements as universal unless the context establishes that they apply
    universally.

23. For each requirement, identify the entity or situation to which it applies
    when that information is available.

24. If the retrieved sources are insufficient for a complete answer, explicitly
    say that the answer is a high-level overview and not an exhaustive checklist.

25. Never claim that an answer is "latest" merely because a web source was found.
    Prefer recent official sources and use the source date when available.    

USER QUESTION:
{question}

CONTEXT:
{context}

Answer in concise bullet points.

For every compliance requirement:
- State the requirement.
- State who it applies to.
- State important conditions/exceptions if supported by the context.
- Do not assume it applies to all startups.

End with:
"Note: Compliance requirements depend on the startup's legal structure,
turnover, activities, employees, funding, and other circumstances."
"""
)


# ---------------------------------------------------------
# GLOBAL COMPONENTS
# ---------------------------------------------------------

_embeddings = None
_retriever = None
_llm = None
_tavily = None
_init_error = None


# ---------------------------------------------------------
# INITIALIZATION
# ---------------------------------------------------------

def _ensure_components() -> Optional[str]:
    global _embeddings, _retriever, _llm, _tavily, _init_error

    if _init_error:
        return _init_error

    if _retriever is not None and _llm is not None:
        return None

    try:
        print("Loading embedding model...")

        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        print("Loading Chroma vector database...")

        vectorstore = Chroma(
            persist_directory=str(Path(__file__).resolve().parent / "chroma_db"),
            embedding_function=_embeddings,
        )

        _retriever = vectorstore.as_retriever(
            search_kwargs={"k": 4}
        )

        print("Loading Ollama model...")

        _llm = OllamaLLM(
            model="qwen3:0.6b"
        )

        tavily_api_key = os.getenv("TAVILY_API_KEY")

        if tavily_api_key:
            _tavily = TavilyClient(
                api_key=tavily_api_key
            )
            print("Tavily enabled.")
        else:
            _tavily = None
            print("Tavily API key not found. Web search disabled.")

        return None

    except Exception as exc:
        _init_error = f"Initialization failed: {exc}"
        return _init_error


# ---------------------------------------------------------
# LOCAL RAG SEARCH
# ---------------------------------------------------------

def retrieve_from_db(query: str) -> list[str]:
    init_error = _ensure_components()

    if init_error or _retriever is None:
        return []

    try:
        docs = _retriever.invoke(query)

        results = []

        for doc in docs:
            content = doc.page_content.strip()

            if not content:
                continue

            metadata = doc.metadata or {}

            source = (
                metadata.get("source")
                or metadata.get("file_path")
                or metadata.get("filename")
                or "Local legal document"
            )

            results.append(
                f"""
SOURCE: {source}

CONTENT:
{content[:1200]}
"""
            )

        return results

    except Exception as exc:
        print(f"Chroma retrieval error: {exc}")
        return []


# ---------------------------------------------------------
# WEB SEARCH - TAVILY
# ---------------------------------------------------------

def retrieve_from_web(query: str) -> list[str]:
    init_error = _ensure_components()

    if init_error or _tavily is None:
        return []

    try:
        # Make the search explicitly India-focused.
        search_query = f"""
India {query}
Indian law regulation compliance
official government source
"""

        print(f"Tavily search: {search_query.strip()}")

        response = _tavily.search(
            query=search_query,
            search_depth="advanced",
            max_results=5,
            include_domains=[
                "gov.in",
                "mca.gov.in",
                "incometax.gov.in",
                "gst.gov.in",
                "startupindia.gov.in",
                "sebi.gov.in",
                "rbi.org.in",
                "irdai.gov.in",
                "pfrda.org.in",
                "ibbi.gov.in",
                "meity.gov.in",
            ],
        )

        results = []

        for result in response.get("results", []):
            title = result.get("title", "Web source")
            content = result.get("content", "")
            url = result.get("url", "")

            if not content:
                continue

            results.append(
                f"""
SOURCE: {title}
URL: {url}

CONTENT:
{content[:1500]}
"""
            )

        return results

    except Exception as exc:
        print(f"Tavily search error: {exc}")
        return []


# ---------------------------------------------------------
# BASIC QUESTION FILTER
# ---------------------------------------------------------

def is_relevant_question(query: str) -> bool:
    """
    Basic filter to prevent the bot from answering
    completely unrelated questions.
    """

    q = query.lower()

    legal_keywords = [
        "law",
        "legal",
        "act",
        "section",
        "regulation",
        "compliance",
        "company",
        "startup",
        "business",
        "gst",
        "tax",
        "income tax",
        "mca",
        "roc",
        "incorporation",
        "llp",
        "private limited",
        "pvt ltd",
        "trademark",
        "copyright",
        "patent",
        "ip",
        "intellectual property",
        "contract",
        "agreement",
        "employment",
        "employee",
        "labour",
        "privacy",
        "data protection",
        "dpdp",
        "sebi",
        "rbi",
        "fema",
        "foreign investment",
        "funding",
        "shareholder",
        "shares",
        "director",
        "founder",
        "investor",
        "esop",
        "licence",
        "license",
        "registration",
        "notice",
        "dispute",
    ]

    return any(keyword in q for keyword in legal_keywords)


# ---------------------------------------------------------
# ANSWER GENERATION
# ---------------------------------------------------------

def stream_answer(
    query: str,
    history: Optional[Iterable] = None
):
    if not query or not query.strip():
        yield "Please enter a question."
        return

    query = query.strip()

    # Simple greetings
    if query.lower() in ["hi", "hello", "hey"]:
        yield "Hi. Ask me anything about Indian startup legal topics."
        return

    # Prevent unrelated questions
    if not is_relevant_question(query):
        yield (
            "I can help with Indian startup legal topics such as "
            "company registration, GST, taxation, contracts, IP, "
            "employment, privacy, funding, and regulatory compliance."
        )
        return

    init_error = _ensure_components()

    if init_error:
        yield f"Service unavailable right now. {init_error}"
        return

    # -----------------------------------------------------
    # Retrieve local legal documents
    # -----------------------------------------------------

    db_context = retrieve_from_db(query)

    # -----------------------------------------------------
    # Retrieve current web information
    # -----------------------------------------------------

    web_context = retrieve_from_web(query)

    all_context = db_context + web_context

    if not all_context:
        yield "I don't have enough information to answer this reliably."
        return

    # Qwen 0.6B is a small model, so keep context limited.
    context = "\n\n---\n\n".join(all_context[:7])

    final_prompt = PROMPT.format(
        context=context,
        question=query,
    )

    try:
        for chunk in _llm.stream(final_prompt):
            yield chunk

    except Exception as exc:
        yield f"Service unavailable right now. {exc}"


# ---------------------------------------------------------
# NON-STREAMING ANSWER
# ---------------------------------------------------------

def generate_answer(
    query: str,
    history: Optional[Iterable] = None
) -> str:

    return "".join(
        stream_answer(query, history)
    )
