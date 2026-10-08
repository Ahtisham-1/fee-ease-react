# 1. Start from an official, lightweight Python 3.12 image
FROM python:3.12-slim

# 2. Set the working directory inside the container to /app
WORKDIR /app

# 3. Copy dependencies list and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy all the backend code into /app
COPY . .

# 5. Expose port 8000
EXPOSE 8000

# 6. Start the server (listening on 0.0.0.0 so the outside world can reach it!)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]