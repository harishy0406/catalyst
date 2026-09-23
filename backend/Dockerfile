# CATALYST FastAPI backend
# Build from the REPO ROOT (the image needs ml/models/ as well as backend/):
#   docker build -f backend/Dockerfile -t catalyst-api .
#   docker run -p 3000:3000 --env-file backend/.env catalyst-api
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=3000

WORKDIR /app

# catboost / scikit-learn wheels need the OpenMP runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Trained model artifacts -> /app/models (searched by app/inference/config.py)
COPY ml/models/*.pkl ./models/

COPY backend/app ./app

# Run as an unprivileged user
RUN useradd --create-home --uid 1000 catalyst
USER catalyst

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\", \"3000\")}/health', timeout=4)"

# Hosts like Render/Railway inject $PORT; defaults to 3000 locally.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-3000} --proxy-headers --forwarded-allow-ips='*'"]
