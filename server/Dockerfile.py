FROM python:3.11
WORKDIR /app
COPY temp/temp.py .
CMD ["python3", "temp.py"]
