from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys

# Initialize the app
app = FastAPI()

# CORS configuration
# Allows the React frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Hello from Python Backend"}

if __name__ == "__main__":
    # Use sys.argv to allow the port to be configured via arguments
    # Default to 8000 if not provided
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass

    uvicorn.run(app, host="127.0.0.1", port=port)