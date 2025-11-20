import json
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, render_template
import re
import html
import requests
import os
from dotenv import load_dotenv
load_dotenv()  # This loads variables from .env file

app = Flask(__name__)

# In-memory storage as fallback for WebContainer environment
prompts_storage = []
next_id = 1

# COSTAR Analysis Function - Fixed issues
def analyze_costar(prompt):
    costar = {
        'Context': '',
        'Objective': '',
        'Style': '',
        'Tone': '',
        'Audience': '',
        'Response': ''
    }
    
    prompt_lower = prompt.lower()
    
    # Context detection - fixed logic
    context_keywords = ['problem', 'situation', 'background', 'scenario', 'case', 'event', 'setting', 'condition', 'circumstance', 'issue', 'environment', 'story', 'theme', 'topic', 'outline', 'perspective', 'framework', 'stage', 'aspect', 'matter', 'basis', 'relation', 'history', 'narrative', 'origin', 'occurrence', 'instance', 'state', 'viewpoint', 'foundation', 'atmosphere', 'contexture', 'landscape', 'cause', 'explanation', 'dilemma', 'subject', 'example', 'detail', 'structure']
    
    context_found = [keyword for keyword in context_keywords if keyword in prompt_lower]
    context_indicators = len(context_found)
    if context_indicators >= 1:
        # Limit the number of keywords shown to avoid overly long responses
        display_keywords = context_found[:3]  # Show only first 3
        costar['Context'] = f'Context specified: {", ".join(display_keywords)}'
    else:
        costar['Context'] = 'Context not specified'
    
    # Objective detection - fixed logic
    objective_keywords = ['goal', 'aim', 'target', 'mission', 'purpose', 'intention', 'ambition', 'aspiration', 'focus', 'dream', 'vision', 'wish', 'plan', 'strategy', 'priority', 'project', 'task', 'pursuit', 'direction', 'initiative', 'expectation', 'outcome', 'achievement', 'milestone', 'benchmark', 'design', 'proposal', 'commitment', 'resolution', 'effort', 'requirement', 'framework', 'assignment', 'destination', 'intention', 'blueprint', 'accomplishment', 'scheme', 'end']
    
    objective_found = [keyword for keyword in objective_keywords if keyword in prompt_lower]
    objective_indicators = len(objective_found)
    if objective_indicators >= 2:
        display_keywords = objective_found[:3]
        costar['Objective'] = f'Clear objective identified: {", ".join(display_keywords)}'
    elif objective_indicators >= 1:
        display_keywords = objective_found[:2]
        costar['Objective'] = f'Objective partially defined: {", ".join(display_keywords)}'
    else:
        costar['Objective'] = 'Objective not specified'
    
    # Style detection - fixed
    style_keywords = ['formal', 'informal', 'casual', 'professional', 'academic', 'creative', 'artistic', 'technical', 'descriptive', 'persuasive', 'narrative', 'analytical', 'visual', 'poetic', 'direct', 'indirect', 'clear', 'complex', 'structured', 'unstructured', 'detailed', 'minimal', 'precise', 'concise', 'figurative', 'literal', 'modern', 'classic', 'innovative', 'traditional', 'expressive', 'neutral', 'colorful', 'balanced', 'dramatic', 'light', 'storytelling', 'objective', 'subjective']
    style_found = [keyword for keyword in style_keywords if keyword in prompt_lower]
    if style_found:
        display_keywords = style_found[:3]
        costar['Style'] = f'Style indicated: {", ".join(display_keywords)}'
    else:
        costar['Style'] = 'No specific style mentioned'
    
    # Tone detection - fixed
    tone_keywords = ['friendly', 'polite', 'respectful', 'humorous', 'serious', 'optimistic', 'pessimistic', 'neutral', 'casual', 'formal', 'motivational', 'inspirational', 'critical', 'analytical', 'empathetic', 'supportive', 'encouraging', 'enthusiastic', 'professional', 'authoritative', 'educational', 'calm', 'gentle', 'warm', 'cool', 'direct', 'indirect', 'positive', 'negative', 'confident', 'sincere', 'playful', 'informative', 'assertive', 'emotional', 'persuasive', 'subtle', 'objective', 'sympathetic', 'compassionate']
    tone_found = [keyword for keyword in tone_keywords if keyword in prompt_lower]
    if tone_found:
        display_keywords = tone_found[:3]
        costar['Tone'] = f'Tone specified: {", ".join(display_keywords)}'
    else:
        costar['Tone'] = 'Tone not specified'
    
    # Audience detection - fixed
    audience_keywords = ['students', 'teachers', 'professionals', 'managers', 'developers', 'designers', 'farmers', 'leaders', 'youth', 'children', 'parents', 'engineers', 'scientists', 'researchers', 'customers', 'clients', 'buyers', 'sellers', 'users', 'workers', 'employees', 'employers', 'startups', 'entrepreneurs', 'investors', 'shareholders', 'citizens', 'communities', 'villagers', 'audience', 'followers', 'subscribers', 'visitors', 'participants', 'readers', 'viewers', 'listeners', 'patients', 'friends']
    audience_found = [keyword for keyword in audience_keywords if keyword in prompt_lower]
    if audience_found:
        display_keywords = audience_found[:3]
        costar['Audience'] = f'Target audience identified: {", ".join(display_keywords)}'
    else:
        costar['Audience'] = 'Audience not specified'  # Fixed inconsistent message
    
    # Response format detection - fixed
    response_keywords = ['answer', 'reply', 'solution', 'feedback', 'comment', 'output', 'reaction', 'return', 'result', 'resolution', 'decision', 'statement', 'acknowledgment', 'confirmation', 'note', 'message', 'expression', 'explanation', 'outcome', 'impact', 'approval', 'denial', 'direction', 'guidance', 'clarification', 'suggestion', 'advice', 'recommendation', 'instruction', 'response', 'verdict', 'announcement', 'communication', 'declaration', 'report', 'update', 'replying', 'correction', 'assessment', 'follow-up']
    response_found = [keyword for keyword in response_keywords if keyword in prompt_lower]
    if response_found:
        display_keywords = response_found[:3]
        costar['Response'] = f'Response format specified: {", ".join(display_keywords)}'
    else:
        costar['Response'] = 'Response format not specified'
    
    return costar

# Fixed Rule Engine with proper scoring
def evaluate_prompt(prompt, costar):
    reasons = []
    score = 0
    max_score = 10
    
    # BLOCK rules - more specific patterns with better matching
    blocked_patterns = [
        r'hack.*system', r'illegal.*download', r'steal.*data', r'commit.*fraud', r'hack.*website',
        r'violent.*threat', r'make.*bomb', r'terrorist', r'child.*abuse', r'cyber.*attack',
        r'mass.*murder', r'assault.*someone', r'harm.*person', r'exploit.*vulnerability', r'zero.*day',
        r'ddos.*attack', r'password.*crack', r'crack.*license', r'phish.*attack', r'carding.*site',
        r'credit.*card.*steal', r'sell.*stolen', r'doxx.*someone', r'dox.*personal', r'how.*to.*poison',
        r'manufacture.*weapon', r'build.*explosive', r'weapon.*blueprint', r'illicit.*drug.*manufacture', 
        r'sell.*drugs', r'buy.*gun', r'shoplift.*method', r'evade.*law', r'how.*to.*escape.*prison',
        r'how.*to.*launder.*money', r'create.*malware', r'write.*ransomware', r'encrypt.*files.*ransom',
        r'hide.*assets', r'fake.*id', r'create.*forged.*document', r'child.*porn', r'human.*traffick',
        r'encourage.*suicide', r'selfharm.*method', r'bestiality', r'rape.*someone', r'assist.*suicide'
    ]
    
    prompt_lower = prompt.lower()
    for pattern in blocked_patterns:
        if re.search(pattern, prompt_lower):
            return 'BLOCK', ['Contains prohibited content']
    
    # NEEDS_FIX rules with proper scoring
    # Length check
    prompt_length = len(prompt.strip())
    if prompt_length < 10:
        reasons.append('Prompt too short (min 10 characters)')
        score -= 2
    elif prompt_length > 1000:
        reasons.append('Prompt too long (max 1000 characters)')
        score -= 1
    else:
        score += 1
    
    # Meaningful text check
    if not any(char.isalpha() for char in prompt):
        reasons.append('No meaningful text found')
        score -= 2
    else:
        score += 1
    
    # Formatting check
    if prompt.isupper() and len(prompt) > 10:  # Only penalize if substantial text is in caps
        reasons.append('All caps text (poor formatting)')
        score -= 1
    else:
        score += 0.5  # Give partial credit for proper formatting
    
    # COSTAR completeness scoring - FIXED LOGIC
    costar_score = 0
    for field, value in costar.items():
        value_lower = value.lower()
        if any(positive in value_lower for positive in ['specified', 'identified', 'indicated', 'clear', 'good']):
            costar_score += 1
        elif 'not specified' in value_lower or 'not mentioned' in value_lower:
            reasons.append(f'{field} needs specification')
            costar_score += 0
        else:
            costar_score += 0.5
            reasons.append(f'{field} could be improved')
    
    score += costar_score
    
    # Determine verdict based on score - FIXED THRESHOLDS
    # Check COSTAR completeness
    incomplete_fields = [field for field, value in costar.items() 
                        if 'could be' in value or 'needs' in value or 'not specified' in value]
    
    if len(incomplete_fields) > 5:
        reasons.append('Missing key COSTAR elements')
    
    if reasons:
        return 'NEEDS_FIX', reasons
    
    return 'ALLOW', ['Prompt meets quality standards']
    

# Improved sanitization
def sanitize_prompt(prompt):
    sanitized = re.sub(r'\s+', ' ', prompt.strip())

    sanitized = html.escape(sanitized)
    # Limit length for safety
    if len(sanitized) > 2000:
        sanitized = sanitized[:2000] + '...'
    return sanitized

# Serve the main page
@app.route('/')
def index():
    try:
        return send_from_directory('.', 'index.html')
    except:
        return jsonify({'message': 'Welcome to Prompt Review API. Use /review endpoint to analyze prompts.'})


@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/signup")
def signup():
    return render_template("signup.html")


# Static file serving - FIXED SECURITY ISSUE
@app.route('/<path:filename>')
def serve_static(filename):
    # Security: prevent directory traversal
    if '..' in filename or filename.startswith('/') or '~' in filename:
        return jsonify({'error': 'Invalid filename'}), 400
    
    # Only allow specific file types for security
    allowed_extensions = ['.html', '.css', '.js', '.json', '.txt', '.ico', '.png', '.jpg', '.jpeg', '.gif']
    if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
        return jsonify({'error': 'File type not allowed'}), 400
    
    try:
        return send_from_directory('.', filename)
    except:
        return jsonify({'error': 'File not found'}), 404

# Main review endpoint - FIXED ERROR HANDLING
@app.route('/review', methods=['POST'])
def review_prompt():
    global next_id
    
    # For demo purposes, we'll skip authentication check on the backend
    # In a real application, you would verify the user's authentication token here
    
    # Check content type
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400
    
    prompt = data.get('prompt', '')
    
    if not prompt or not isinstance(prompt, str):
        return jsonify({'error': 'No valid prompt provided'}), 400
    
    if len(prompt.strip()) == 0:
        return jsonify({'error': 'Prompt cannot be empty'}), 400
    
    # Check prompt length limit
    if len(prompt) > 5000:
        return jsonify({'error': 'Prompt too long (max 5000 characters)'}), 400
    
    try:
        # Analyze COSTAR
        costar = analyze_costar(prompt)
        
        # Evaluate prompt
        verdict, reasons = evaluate_prompt(prompt, costar)
        
        # Sanitize prompt
        sanitized = sanitize_prompt(prompt)
        
        # Store in memory
        prompt_record = {
            'id': next_id,
            'original_prompt': prompt[:500],  # Limit storage size
            'sanitized_prompt': sanitized,
            'verdict': verdict,
            'reasons': reasons,
            'costar_analysis': costar,
            'timestamp': datetime.now().isoformat()
        }
        
        prompts_storage.append(prompt_record)
        prompt_id = next_id
        next_id += 1
        
        return jsonify({
            'id': prompt_id,
            'verdict': verdict,
            'reasons': reasons,
            'costar': costar,
            'sanitized_prompt': sanitized,
            'timestamp': prompt_record['timestamp'],
            'status': 'success'
        })
        
    except Exception as e:
        app.logger.error(f"Error processing prompt: {str(e)}")
        return jsonify({'error': f'Processing error: {str(e)}'}), 500

# LLM Broker endpoint - FIXED ERROR HANDLING
@app.route('/broker', methods=['POST'])
def broker_llm():
    # Check content type
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid JSON data'}), 400
    
    prompt = data.get('prompt', '')
    llm = data.get('llm', 'ChatGPT')
    
    if not prompt or not isinstance(prompt, str):
        return jsonify({'error': 'No valid prompt provided'}), 400
    
    if len(prompt.strip()) == 0:
        return jsonify({'error': 'Prompt cannot be empty'}), 400
    
    # Check prompt length limit
    if len(prompt) > 5000:
        return jsonify({'error': 'Prompt too long (max 5000 characters)'}), 400
    
    # Validate LLM choice
    valid_llms = ['ChatGPT', 'DeepSeek', 'Claude']
    if llm not in valid_llms:
        return jsonify({'error': f'Invalid LLM choice. Must be one of: {", ".join(valid_llms)}'}), 400
    
    try:
        if llm == 'ChatGPT':
            response_text = call_chatgpt(prompt)
        elif llm == 'DeepSeek':
            response_text = call_deepseek(prompt)
        elif llm == 'Claude':
            response_text = call_claude(prompt)
        else:
            response_text = call_chatgpt(prompt)  # Default fallback
        
        return jsonify({
            'llm': llm,
            'response': response_text,
            'timestamp': datetime.now().isoformat(),
            'status': 'success'
        })
        
    except Exception as e:
        app.logger.error(f"LLM API error for {llm}: {str(e)}")
        return jsonify({
            'llm': llm,
            'error': str(e),
            'timestamp': datetime.now().isoformat(),
            'status': 'error'
        }), 500

# API calling functions with better error handling
def call_chatgpt(prompt):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise Exception("OpenAI API key not configured")
    
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1000,
        "temperature": 0.7
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content']
    except requests.exceptions.RequestException as e:
        raise Exception(f"OpenAI API error: {str(e)}")
    except KeyError as e:
        raise Exception(f"OpenAI API response format error: {str(e)}")

def call_deepseek(prompt):
    api_key = os.getenv('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')
    if not api_key:
        raise Exception("DeepSeek API key not configured")
    
    url = "https://api.deepseek.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1000,
        "temperature": 0.7
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content']
    except requests.exceptions.RequestException as e:
        raise Exception(f"DeepSeek API error: {str(e)}")
    except KeyError as e:
        raise Exception(f"DeepSeek API response format error: {str(e)}")

def call_claude(prompt):
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        raise Exception("Anthropic API key not configured")
    
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01"
    }
    data = {
        "model": "claude-3-sonnet-20240229",
        "max_tokens": 1000,
        "temperature": 0.7,
        "messages": [{"role": "user", "content": prompt}]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result['content'][0]['text']
    except requests.exceptions.RequestException as e:
        raise Exception(f"Claude API error: {str(e)}")
    except KeyError as e:
        raise Exception(f"Claude API response format error: {str(e)}")

# Statistics endpoint - FIXED
@app.route('/stats', methods=['GET'])
def get_stats():
    try:
        # Calculate verdict counts from in-memory storage
        verdict_counts = {'ALLOW': 0, 'NEEDS_FIX': 0, 'BLOCK': 0}
        for prompt in prompts_storage:
            verdict = prompt['verdict']
            verdict_counts[verdict] = verdict_counts.get(verdict, 0) + 1
        
        return jsonify({
            'verdict_counts': verdict_counts,
            'recent_prompts': min(10, len(prompts_storage)),
            'total_prompts': len(prompts_storage),
            'status': 'success'
        })
    except Exception as e:
        app.logger.error(f"Stats error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

# History endpoint with pagination - FIXED
@app.route('/history', methods=['GET'])
def get_history():
    try:
        # Get pagination parameters with defaults
        try:
            limit = min(int(request.args.get('limit', 10)), 50)  # Max 50 items
            offset = max(0, int(request.args.get('offset', 0)))  # Ensure non-negative
        except ValueError:
            return jsonify({'error': 'Invalid limit or offset parameter'}), 400
        
        # Return prompts sorted by timestamp
        sorted_prompts = sorted(prompts_storage, key=lambda x: x['timestamp'], reverse=True)
        
        # Apply pagination
        paginated_prompts = sorted_prompts[offset:offset + limit]
        
        return jsonify({
            'prompts': paginated_prompts,
            'total': len(sorted_prompts),
            'limit': limit,
            'offset': offset,
            'status': 'success'
        })
    except Exception as e:
        app.logger.error(f"History error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

# Single prompt by ID - FIXED
@app.route('/history/<int:prompt_id>', methods=['GET'])
def get_prompt_by_id(prompt_id):
    try:
        # Find prompt by ID
        prompt = next((p for p in prompts_storage if p['id'] == prompt_id), None)
        if not prompt:
            return jsonify({'error': 'Prompt not found', 'status': 'error'}), 404
        
        return jsonify({'prompt': prompt, 'status': 'success'})
    except Exception as e:
        app.logger.error(f"Prompt by ID error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

# Clear history endpoint - FIXED
@app.route('/history', methods=['DELETE'])
def clear_history():
    global prompts_storage, next_id
    try:
        prompts_storage.clear()
        next_id = 1
        return jsonify({'message': 'History cleared successfully', 'status': 'success'})
    except Exception as e:
        app.logger.error(f"Clear history error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'prompts_stored': len(prompts_storage),
        'version': '1.0'
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found', 'status': 'error'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error', 'status': 'error'}), 500

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed', 'status': 'error'}), 405

if __name__ == '__main__':
    # Add logging configuration
    import logging
    logging.basicConfig(level=logging.INFO)
    
    app.run(debug=True, host='0.0.0.0', port=5000)