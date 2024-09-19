from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

# Configure Gemini API
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash-latest")

app = Flask(__name__)
CORS(app)

@app.route('/chat', methods=['POST'])
def chat_endpoint():
    data = request.json
    user_input = data.get('message', '').strip()

    if user_input:
        try:
            response = model.start_chat(history=[]).send_message(user_input, stream=True)
            response_text = ''.join([chunk.text for chunk in response])
            return jsonify({"response": response_text})
        except Exception as e:
            print(f"Error in /chat endpoint: {e}")
            return jsonify({"error": "Internal Server Error"}), 500
    else:
        return jsonify({"response": "No message provided"}), 400

# Use a safe temporary directory
TEMP_DIR = os.path.join(os.getcwd(), 'tmp')
os.makedirs(TEMP_DIR, exist_ok=True)

def process_file(file_path):
    return genai.upload_file(path=file_path)

@app.route('/upload', methods=['POST'])
def file_generate():
    if 'files' not in request.files:
        return jsonify({'message': 'No files provided'}), 400

    files = request.files.getlist('files')
    if not files:
        return jsonify({'message': 'No files selected'}), 400

    prompt = request.form.get('message', '').strip()
    if not prompt:
        return jsonify({'message': 'No prompt provided for the files'}), 400
    responses = []

    try:
        for file in files:
            if file.filename == '':
                continue

            filename = secure_filename(file.filename)
            file_path = os.path.join(TEMP_DIR, filename)
            file.save(file_path)

            content = process_file(file_path)

            response = model.generate_content([prompt, content])
            response_text = ''.join([chunk.text for chunk in response])

            genai.delete_file(content)

            responses.append({
                'filename': filename,
                'response': response_text
            })

            os.remove(file_path)

        if not responses:
            return jsonify({'message': 'No files processed'}), 400

        return jsonify({"responses": responses})

    except Exception as e:
        print(f"Error in /upload endpoint: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

if __name__ == "__main__":
    app.run(debug=False,host='0.0.0.0', port=5000)
