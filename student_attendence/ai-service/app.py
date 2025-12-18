"""
Face Recognition AI Service for Attendance System
Uses Flask to receive requests and process face recognition
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import os
from datetime import datetime
import threading
import requests

# --- YAHAN CHANGE HAI ---
# Hum 'load_image_file' ko bhi import kar rahe hain
from face_recognition import face_encodings, compare_faces, face_locations, load_image_file
import json
import io # <-- Ise bhi import karein
import time

app = Flask(__name__)
CORS(app)

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000/api')
AI_SERVICE_TOKEN = os.getenv('AI_SERVICE_TOKEN', 'your_ai_service_secret_token')

# Active sessions storage
active_sessions = {}
session_lock = threading.Lock()

def recognize_face_in_frame(frame, known_encodings, known_students):
    """
    Recognize a face in a frame by comparing with known encodings
    """
    # Is function mein koi change nahi hai
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_locs = face_locations(rgb_frame)
    if not face_locs:
        return None, 0
    frame_encodings = face_encodings(rgb_frame, face_locs)
    if not frame_encodings:
        return None, 0
    for frame_encoding in frame_encodings:
        matches = compare_faces(known_encodings, frame_encoding, tolerance=0.6)
        if True in matches:
            match_index = matches.index(True)
            student_id = known_students[match_index]
            distances = np.linalg.norm(known_encodings - frame_encoding, axis=1)
            min_distance = distances[match_index]
            confidence = max(0, min(100, (1 - min_distance) * 100))
            if confidence >= 10:
                return student_id, confidence
    return None, 0

def process_cctv_feed(session_id, students_data):
    """
    Continuously process CCTV feed for a session
    """
    known_encodings = []
    known_students = []
    
    # --- YAHAN CHANGE KAREIN ---
    for student in students_data:
        # Check karein ki 'faceEmbedding' maujood hai aur 128 size ka hai
        if student.get('faceEmbedding') and len(student['faceEmbedding']) == 128:
            try:
                # Convert faceEmbedding list to numpy array
                embedding = np.array(student['faceEmbedding'], dtype=np.float64)
                known_encodings.append(embedding)
                known_students.append(student['studentId'])
            except Exception as e:
                print(f"Failed to process embedding for student {student.get('studentId')}: {e}")
        else:
            # Agar embedding nahi hai, toh log karein
            print(f"Skipping student {student.get('studentId')} - No valid face embedding found.")
    # --- CHANGE KHATAM ---

    if not known_encodings:
        print(f"No students with valid face embeddings for session {session_id}. Stopping thread.")
        return
    
    # ... (baaki saara code cap = cv2.VideoCapture(0) waisa hi rahega) ...
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print(f"Error: Webcam (index 0) ko nahi khol paaya. Session {session_id} band kar raha hoon.")
        return
        
    last_recognized = {}
    
    print(f"Starting face recognition for session {session_id}")
    
    # ... (baaki saara code waisa hi rahega) ...
    """
    Continuously process CCTV feed for a session
    """
    print("cctv started")
    # ... (Aapka known_encodings waala code waisa hi rahega) ...
    for student in students_data:
        # ...
        known_encodings.append(embedding)
        known_students.append(student['studentId'])
    
    if not known_encodings:
        print(f"No students with face embeddings for session {session_id}")
        return
    
    # --- YAHAN DEKHEIN ---
    cap = cv2.VideoCapture(0)  # Webcam ko access karne ki koshish karein
    
    # --- YEH CHECK ADD KAREIN ---
    if not cap.isOpened():
        print(f"Error: Webcam (index 0) ko nahi khol paaya. Session {session_id} band kar raha hoon.")
        # (Optional) Aap yahan MERN backend ko error bhej sakte hain
        return  # Thread ko yahin rok dein
    # --- CHECK KHATAM ---
    
    last_recognized = {} 
    
    print(f"Starting face recognition for session {session_id}")
    
    while active_sessions.get(session_id, {}).get('active', False):
        ret, frame = cap.read()
        
        if not ret:
            break
        
        # ... (Baaki saara code waisa hi rahega) ...
    
    cap.release()
    print(f"Stopped face recognition for session {session_id}")
    """
    Continuously process CCTV feed for a session
    """
    # Is function mein koi change nahi hai
    known_encodings = []
    known_students = []
    for student in students_data:
        embedding = np.array(student['faceEmbedding'], dtype=np.float64)
        known_encodings.append(embedding)
        known_students.append(student['studentId'])
    if not known_encodings:
        print(f"No students with face embeddings for session {session_id}")
        return
    cap = cv2.VideoCapture(0)
    last_recognized = {}
    print(f"Starting face recognition for session {session_id}")
    while active_sessions.get(session_id, {}).get('active', False):
        ret, frame = cap.read()
        if not ret:
            break
        student_id, confidence = recognize_face_in_frame(frame, known_encodings, known_students)
        if student_id:
            now = datetime.now()
            last_time = last_recognized.get(student_id)
            if not last_time or (now - last_time).seconds >= 5:
                try:
                    response = requests.post(
                        f'{BACKEND_URL}/attendance/face-verify',
                        json={'sessionId': session_id, 'studentId': student_id, 'confidence': confidence},
                        headers={'x-ai-service-token': AI_SERVICE_TOKEN, 'Content-Type': 'application/json'},
                        timeout=5
                    )
                    if response.status_code == 200:
                        print(f"Recognized {student_id} in session {session_id} (confidence: {confidence:.2f}%)")
                        last_recognized[student_id] = now
                except Exception as e:
                    print(f"Error sending recognition to backend: {e}")
        cv2.waitKey(33)
    cap.release()
    print(f"Stopped face recognition for session {session_id}")

@app.route('/start-session', methods=['POST'])
def start_session():
    """Start face recognition for a session"""
    print("Start face recognition for a session")
    # Is function mein koi change nahi hai
    try:
        data = request.json
        session_id = data.get('sessionId')
        students = data.get('students', [])
        if not session_id or not students:
            return jsonify({'success': False, 'message': 'sessionId and students are required'}), 400
        with session_lock:
            if session_id in active_sessions:
                return jsonify({'success': False, 'message': 'Session already active'}), 400
            thread = threading.Thread(target=process_cctv_feed, args=(session_id, students), daemon=True)
            active_sessions[session_id] = {'students': students, 'active': True, 'thread': thread}
            thread.start()
        return jsonify({'success': True, 'message': f'Face recognition started for session {session_id}'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/stop-session', methods=['POST'])
def stop_session():
    """Stop face recognition for a session"""
    # Is function mein koi change nahi hai
    try:
        data = request.json
        session_id = data.get('sessionId')
        if not session_id:
            return jsonify({'success': False, 'message': 'sessionId is required'}), 400
        with session_lock:
            if session_id in active_sessions:
                active_sessions[session_id]['active'] = False
                del active_sessions[session_id]
                return jsonify({'success': True, 'message': f'Face recognition stopped for session {session_id}'}), 200
            else:
                return jsonify({'success': False, 'message': 'Session not found or not active'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# --- IS POORE FUNCTION KO REPLACE KIYA GAYA HAI ---
@app.route('/generate-embedding', methods=['POST'])
def generate_embedding():
    """
    Generate face embedding from a Base64 image
    """
    print("\n--- FIXED VERSION (Ensuring RGB Image) ---")

    try:
        data = request.json
        if 'faceImage' not in data:
            return jsonify({'success': False, 'message': 'No faceImage provided'}), 400

        # 1️⃣ Strip base64 prefix
        try:
            image_data_url = data['faceImage']
            header, base64_data = image_data_url.split(',', 1)
        except ValueError:
            return jsonify({'success': False, 'message': 'Invalid faceImage format'}), 400

        # 2️⃣ Decode Base64
        image_bytes = base64.b64decode(base64_data)
        np_array = np.frombuffer(image_bytes, np.uint8)

        # 3️⃣ Decode image with OpenCV
        image_bgr = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
        if image_bgr is None:
            return jsonify({'success': False, 'message': 'Invalid image data'}), 400

        # 4️⃣ Convert BGR → RGB
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        # 5️⃣ Detect face + generate embedding
        face_locs = face_locations(image_rgb)
        if not face_locs:
            return jsonify({'success': False, 'message': 'No face found in the image'}), 400

        encodings = face_encodings(image_rgb, face_locs)
        if not encodings:
            return jsonify({'success': False, 'message': 'Face found but could not generate embedding'}), 400

        embedding = encodings[0].tolist()
        return jsonify({'success': True, 'embedding': embedding}), 200

    except Exception as e:
        print(f"Error generating embedding: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# --- END OF REPLACED SECTION ---

# ... (aapke saare imports) ...
# ... (aapka recognize_face_in_frame function jaisa hai waisa hi rahega) ...

# --- YEH NAYA ENDPOINT ADD KAREIN ---
@app.route('/verify-single-face', methods=['POST'])
def verify_single_face():
    """
    Ek single student ke embedding ko webcam ke current frame se verify karein.
    """
    try:
        data = request.json
        if 'faceEmbedding' not in data:
            return jsonify({'success': False, 'message': 'No faceEmbedding provided'}), 400

        # 1. MERN server se embedding lein
        known_embedding = np.array(data['faceEmbedding'], dtype=np.float64)
        
        # 2. Webcam chalu karein
        # (Ismein '0' ki jagah apni CCTV URL daal sakte hain)
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            return jsonify({'success': False, 'message': 'Webcam nahi khol paaya'}), 500
        
        # 3. Ek single frame capture karein
        ret, frame = cap.read()
        
        # 4. Webcam ko turant band kar dein
        cap.release()
        
        if not ret:
            return jsonify({'success': False, 'message': 'Webcam se frame nahi mila'}), 500

        # 5. Apne puraane function ka istemaal karke chehra dhoondhein
        # Hum 'known_students' mein sirf '1' bhej rahe hain, kyunki humein ID se matlab nahi,
        # bas match hua ya nahi, usse matlab hai.
        student_id, confidence = recognize_face_in_frame(
            frame, 
            [known_embedding], # List mein sirf ek embedding
            ['student_to_check'] # Bas ek placeholder
        )
        
        # 6. MERN ko response bhejein
        if student_id is not None:
            print(f"Single verification success. Confidence: {confidence}")
            return jsonify({'success': True, 'match_found': True, 'confidence': confidence})
        else:
            print("Single verification failed: Face not found in frame.")
            return jsonify({'success': True, 'match_found': False})

    except Exception as e:
        print(f"Error in /verify-single-face: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
# --- NAYA ENDPOINT KHATAM ---


# ... (aapka baaki saara code, /start-session, /stop-session, etc.) ...


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'active_sessions': len([s for s in active_sessions.values() if s['active']])
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    # Note: host='0.0.0.0' is correct, host='0.0.0.de' was a typo in the original
    app.run(host='0.0.0.0', port=port, debug=True)