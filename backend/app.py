from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai
from flask_cors import CORS
from plugin_manager import manager  # Import Plugin Manager

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Configure Gemini
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)
    try:
        # User requested gemini-2.5-flash
        chat_model = genai.GenerativeModel('gemini-2.5-flash')
        diagnosis_model = genai.GenerativeModel('gemini-2.5-flash') 
    except:
        print("Detailed error: gemini-2.5-flash failed, falling back")
        chat_model = genai.GenerativeModel('gemini-1.5-flash')
        diagnosis_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    print("WARNING: GEMINI_API_KEY not found in .env")

# Discover plugins on startup
plugins = manager.discover_plugins()
print(f"Loaded plugins: {[p['name'] for p in plugins]}")

@app.route('/predict', methods=['POST'])
def predict():
    """
    Analyzes symptoms using Gemini to provide a differential diagnosis.
    """
    if not GENAI_API_KEY:
         return jsonify({'error': 'API Key not configured'}), 503

    data = request.json
    symptoms = data.get('symptoms', [])
    profile = data.get('profile', {}) or {}
    
    if not symptoms:
         return jsonify({'error': 'No symptoms provided'}), 400

    try:
        profile_lines = []
        if profile.get('age'): profile_lines.append(f"Age: {profile.get('age')}")
        if profile.get('sex'): profile_lines.append(f"Sex: {profile.get('sex')}")
        if profile.get('height'): profile_lines.append(f"Height: {profile.get('height')} cm")
        if profile.get('weight'): profile_lines.append(f"Weight: {profile.get('weight')} kg")
        if profile.get('location'): profile_lines.append(f"Location: {profile.get('location')}")
        if profile.get('conditions'): profile_lines.append(f"Existing conditions: {profile.get('conditions')}")
        if profile.get('medications'): profile_lines.append(f"Medications: {profile.get('medications')}")
        if profile.get('allergies'): profile_lines.append(f"Allergies: {profile.get('allergies')}")
        profile_block = "\n".join(profile_lines) if profile_lines else "Not provided."

        # Construct a prompt for the model
        prompt = f"""
        You are an expert medical diagnostician. 
        Patient profile (if available):
        {profile_block}

        Symptoms: {', '.join(symptoms)}.
        Provide a differential diagnosis. List the top 3 most likely conditions based on these symptoms and context.
        Format your response as a JSON object with a 'prediction' field (most likely condition) and a 'reasoning' field (concise explanation).
        """
        
        response = diagnosis_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        
        # Parse the JSON response
        import json
        result = json.loads(response.text)
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in prediction: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """
    Chat endpoint for the AI Doctor.
    """
    if not GENAI_API_KEY:
        return jsonify({'error': 'API Key not configured'}), 503
    
    data = request.json
    message = data.get('message')
    history = data.get('history', [])
    profile = data.get('profile', {}) or {}
    tool = data.get('tool', 'chat')
    conversation_started = data.get('conversation_started')
    
    try:
        formatted_history = []
        if isinstance(history, list):
            for item in history:
                role = item.get('role', 'user')
                if role not in ('user', 'model'):
                    role = 'user'
                text = item.get('text')
                if text:
                    formatted_history.append({
                        "role": role,
                        "parts": [{"text": text}]
                    })

        # Construct chat session (simplified for now, ideally persistent)
        chat_session = chat_model.start_chat(history=formatted_history)
        
        profile_lines = []
        if profile.get('age'): profile_lines.append(f"Age: {profile.get('age')}")
        if profile.get('sex'): profile_lines.append(f"Sex: {profile.get('sex')}")
        if profile.get('height'): profile_lines.append(f"Height: {profile.get('height')} cm")
        if profile.get('weight'): profile_lines.append(f"Weight: {profile.get('weight')} kg")
        if profile.get('location'): profile_lines.append(f"Location: {profile.get('location')}")
        if profile.get('conditions'): profile_lines.append(f"Existing conditions: {profile.get('conditions')}")
        if profile.get('medications'): profile_lines.append(f"Medications: {profile.get('medications')}")
        if profile.get('allergies'): profile_lines.append(f"Allergies: {profile.get('allergies')}")
        profile_block = "\n".join(profile_lines) if profile_lines else "Not provided."
        has_history = bool(formatted_history)
        if conversation_started is None:
            conversation_started = has_history

        system_instruction = (
            "You are CuraLytica, a careful, patient medical assistant. "
            "Be concise, calm, and clinically helpful. "
            "Do not list capabilities or give long lectures. "
            "Use the conversation history and do not repeat questions already answered. "
            "If the user greets again, acknowledge briefly without restarting the conversation. "
            "Ask 1-3 focused follow-up questions only when key details are missing. "
            "If enough information is available, provide a short assessment and next steps. "
            "Summarize what you understood in 1-2 sentences before advice. "
            "Provide possible causes as possibilities (not definitive diagnoses). "
            "Include red-flag warnings only when appropriate. "
            "Do not claim access to live outbreak data or the internet. "
            "If location is provided, consider common local factors but say when data is unavailable. "
            "Format your reply using short sections with headers (e.g., Summary, Possible causes, Next steps, Questions) "
            "and use bullet points where appropriate."
        )
        
        tool_context = f"Tool mode: {tool}."
        conversation_note = "Conversation already started. Do not greet again." if conversation_started else "First message. A brief greeting is okay."
        response = chat_session.send_message(
            f"{system_instruction}\n"
            f"{conversation_note}\n"
            f"Patient profile:\n{profile_block}\n"
            f"{tool_context}\n"
            f"User: {message}"
        )
        return jsonify({'reply': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze-image', methods=['POST'])
async def analyze_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Use Plugin Manager to run the tool
        try:
            tool_name = "analyze_chest_xray"
            # Get the plugin to ensure it's available
            plugin = manager.get_plugin_by_tool(tool_name)
            if not plugin:
                 return jsonify({'error': 'Medical Imaging plugin not found or not loaded.'}), 503

            analysis_result = await manager.run_tool(tool_name, {"image_path": filepath})
            return jsonify({'analysis': analysis_result, 'file_path': filepath})
        except ValueError as e:
             return jsonify({'error': f"Tool usage error: {str(e)}"}), 404
        except Exception as e:
            return jsonify({'error': f"Internal Server Error: {str(e)}"}), 500

@app.route('/chat-title', methods=['POST'])
def chat_title():
    if not GENAI_API_KEY:
        return jsonify({'error': 'API Key not configured'}), 503

    data = request.json or {}
    messages = data.get('messages', [])

    try:
        snippet_lines = []
        for msg in messages:
            sender = msg.get('sender')
            text = (msg.get('text') or '').strip()
            if not text:
                continue
            label = 'User' if sender == 'user' else 'Assistant'
            snippet_lines.append(f"{label}: {text}")
        snippet = "\n".join(snippet_lines[:8]) or "General medical chat."

        prompt = (
            "Generate a concise 3-6 word title that summarizes this conversation. "
            "Use title case. Do not use quotes, punctuation, or trailing periods.\n\n"
            f"{snippet}"
        )
        response = chat_model.generate_content(prompt)
        title = (response.text or '').strip()
        if not title:
            raise ValueError("No title returned")
        return jsonify({'title': title})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
