# Face Recognition AI Service

Python Flask service for face recognition in the attendance system.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

**Note**: Installing `dlib` and `face-recognition` may require additional system dependencies:
- On Ubuntu/Debian: `sudo apt-get install cmake build-essential`
- On macOS: `brew install cmake`

2. Set environment variables:
```bash
export BACKEND_URL=http://localhost:5000/api
export AI_SERVICE_TOKEN=your_ai_service_secret_token
export PORT=8000
```

3. Run the service:
```bash
python app.py
```

## Endpoints

### POST /start-session
Start face recognition for a session.

**Request:**
```json
{
  "sessionId": "session_id",
  "students": [
    {
      "studentId": "student_id",
      "faceEmbedding": [0.123, 0.456, ...],
      "name": "Student Name"
    }
  ]
}
```

### POST /stop-session
Stop face recognition for a session.

**Request:**
```json
{
  "sessionId": "session_id"
}
```

### GET /health
Health check endpoint.

## Configuration

- **Video Source**: Currently configured to use webcam (index 0). Change `cv2.VideoCapture(0)` in `app.py` to use:
  - CCTV URL: `cv2.VideoCapture('rtsp://cctv_url')`
  - Video file: `cv2.VideoCapture('path/to/video.mp4')`

## Integration

The service automatically sends recognition results to the backend at `/api/attendance/face-verify`.

## Requirements

- Python 3.8+
- OpenCV
- face-recognition library
- dlib



