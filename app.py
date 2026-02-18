# Import necessary libraries
from flask import Flask, render_template, request, session, redirect, url_for
import requests
import random

# Create Flask app
app = Flask(__name__)
app.secret_key = 'your-secret-key-here-12345'  # Needed for session management

# Home page - Start quiz
@app.route('/')
def home():
    return render_template('home.html')

# Start quiz - Fetch questions from API
@app.route('/start', methods=['POST'])
def start_quiz():
    # Get number of questions from form (default: 5)
    num_questions = request.form.get('num_questions', 5)
    
    # Fetch questions from Open Trivia Database (Free API)
    url = f'https://opentdb.com/api.php?amount={num_questions}&type=multiple'
    response = requests.get(url)
    data = response.json()
    
    # Store questions in session
    session['questions'] = data['results']
    session['current_question'] = 0
    session['score'] = 0
    session['answers'] = []  # Store user's answers for review
    
    return redirect(url_for('quiz'))

# Quiz page - Display questions one by one
@app.route('/quiz')
def quiz():
    # Check if quiz is completed
    if session['current_question'] >= len(session['questions']):
        return redirect(url_for('results'))
    
    # Get current question
    question_data = session['questions'][session['current_question']]
    
    # Mix correct and incorrect answers
    options = question_data['incorrect_answers'] + [question_data['correct_answer']]
    random.shuffle(options)
    
    return render_template('quiz.html', 
                         question=question_data['question'],
                         options=options,
                         question_num=session['current_question'] + 1,
                         total=len(session['questions']))

# Submit answer
@app.route('/submit', methods=['POST'])
def submit_answer():
    user_answer = request.form.get('answer')
    question_data = session['questions'][session['current_question']]
    correct_answer = question_data['correct_answer']
    
    # Check if answer is correct
    is_correct = user_answer == correct_answer
    
    # Update score
    if is_correct:
        session['score'] = session.get('score', 0) + 1
    
    # Store answer for review
    answer_record = {
        'question': question_data['question'],
        'user_answer': user_answer,
        'correct_answer': correct_answer,
        'is_correct': is_correct
    }
    
    answers = session.get('answers', [])
    answers.append(answer_record)
    session['answers'] = answers
    
    # Move to next question
    session['current_question'] = session.get('current_question', 0) + 1
    
    return redirect(url_for('quiz'))

# Results page
@app.route('/results')
def results():
    score = session.get('score', 0)
    total = len(session.get('questions', []))
    answers = session.get('answers', [])
    
    return render_template('results.html', 
                         score=score, 
                         total=total,
                         answers=answers)

# Run the app
if __name__ == '__main__':
    app.run(debug=True)