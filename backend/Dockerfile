# Use an official Python runtime as a base image
FROM python:3.11-slim-buster 

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory in the container
WORKDIR /app

# Copy only the requirements file first to leverage Docker caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire application code into the container
COPY . .

# Expose the port your application will run on (e.g., 5000 for Flask's default)
EXPOSE 5000

# Define the command to run the Flask application when the container starts
# Replace 'app.py' with the name of your main Flask application file
CMD ["python", "server.py"]