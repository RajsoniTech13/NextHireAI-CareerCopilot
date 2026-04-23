FROM python:3.11-slim
WORKDIR /app
COPY api/requirements_api.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY api/ ./
COPY outputs/ ./outputs/
EXPOSE 5001
CMD ["python", "predict_api.py"]
