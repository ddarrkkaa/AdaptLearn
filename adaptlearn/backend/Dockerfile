FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libffi-dev libpq-dev git ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -m spacy download en_core_web_sm

RUN python -c "from faster_whisper import WhisperModel; WhisperModel('tiny', device='cpu', compute_type='int8')"

COPY . .

EXPOSE 8000
