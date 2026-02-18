/* =====================================================
   JAVASCRIPT FOR QUIZ APPLICATION
   This file handles all the frontend logic
   ===================================================== */

// =====================================================
// GLOBAL VARIABLES
// =====================================================
let currentSessionId = null;  // Store session ID from backend
let questions = [];            // Store all questions
let currentQuestionIndex = 0;  // Track current question
let selectedAnswer = null;     // Store selected answer

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Show a specific screen and hide others
 * @param {string} screenId - ID of the screen to show
 */
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the requested screen
    document.getElementById(screenId).classList.add('active');
}

/**
 * Decode HTML entities (from API responses)
 * @param {string} html - HTML string to decode
 */
function decodeHTML(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

// =====================================================
// FUNCTION 1: START QUIZ
// =====================================================
async function startQuiz() {
    try {
        // Show loading screen
        showScreen('loading-screen');
        
        // Get selected number of questions
        const numQuestions = document.getElementById('num-questions').value;
        
        // Call backend API to get questions
        const response = await fetch('/api/start-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                num_questions: parseInt(numQuestions)
            })
        });
        
        // Check if request was successful
        if (!response.ok) {
            throw new Error('Failed to load questions');
        }
        
        // Parse response data
        const data = await response.json();
        
        // Store data in global variables
        currentSessionId = data.session_id;
        questions = data.questions;
        currentQuestionIndex = 0;
        
        // Show first question
        showScreen('quiz-screen');
        displayQuestion();
        
    } catch (error) {
        console.error('Error starting quiz:', error);
        alert('Failed to load questions. Please check your internet connection and try again.');
        showScreen('home-screen');
    }
}

// =====================================================
// FUNCTION 2: DISPLAY QUESTION
// =====================================================
function displayQuestion() {
    // Get current question data
    const question = questions[currentQuestionIndex];
    
    // Update progress bar
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';
    
    // Update question number
    document.getElementById('question-number').textContent = 
        `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    
    // Update category and difficulty
    document.getElementById('category').textContent = decodeHTML(question.category);
    const difficultyElement = document.getElementById('difficulty');
    difficultyElement.textContent = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);
    difficultyElement.className = 'difficulty ' + question.difficulty;
    
    // Update question text
    document.getElementById('question-text').innerHTML = decodeHTML(question.question);
    
    // Display answer options
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = ''; // Clear previous options
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.innerHTML = decodeHTML(option);
        optionDiv.onclick = () => selectOption(index, option);
        optionsContainer.appendChild(optionDiv);
    });
    
    // Reset buttons
    document.getElementById('submit-btn').disabled = true;
    document.getElementById('submit-btn').style.display = 'block';
    document.getElementById('next-btn').style.display = 'none';
    
    // Reset selected answer
    selectedAnswer = null;
}

// =====================================================
// FUNCTION 3: SELECT OPTION
// =====================================================
function selectOption(optionIndex, optionText) {
    // Remove 'selected' class from all options
    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected'));
    
    // Add 'selected' class to clicked option
    options[optionIndex].classList.add('selected');
    
    // Store selected answer
    selectedAnswer = optionText;
    
    // Enable submit button
    document.getElementById('submit-btn').disabled = false;
}

// =====================================================
// FUNCTION 4: SUBMIT ANSWER
// =====================================================
async function submitAnswer() {
    try {
        // Disable submit button to prevent multiple clicks
        document.getElementById('submit-btn').disabled = true;
        
        // Call backend API to check answer
        const response = await fetch('/api/submit-answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: currentSessionId,
                question_id: currentQuestionIndex,
                answer: selectedAnswer
            })
        });
        
        const data = await response.json();
        
        // Show feedback to user
        showAnswerFeedback(data.is_correct, data.correct_answer);
        
        // Disable all options after submission
        const options = document.querySelectorAll('.option');
        options.forEach(opt => {
            opt.classList.add('disabled');
            opt.onclick = null;
        });
        
        // Hide submit button, show next button
        document.getElementById('submit-btn').style.display = 'none';
        
        // Check if this is the last question
        if (currentQuestionIndex < questions.length - 1) {
            document.getElementById('next-btn').style.display = 'block';
        } else {
            // Last question - show "View Results" button
            const nextBtn = document.getElementById('next-btn');
            nextBtn.textContent = 'View Results';
            nextBtn.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error submitting answer:', error);
        alert('Failed to submit answer. Please try again.');
        document.getElementById('submit-btn').disabled = false;
    }
}

// =====================================================
// FUNCTION 5: SHOW ANSWER FEEDBACK
// =====================================================
function showAnswerFeedback(isCorrect, correctAnswer) {
    const options = document.querySelectorAll('.option');
    
    options.forEach(option => {
        const optionText = option.innerHTML;
        
        // Highlight correct answer in green
        if (decodeHTML(optionText) === decodeHTML(correctAnswer)) {
            option.classList.add('correct');
        }
        
        // Highlight incorrect answer in red (if user selected wrong)
        if (!isCorrect && option.classList.contains('selected')) {
            option.classList.add('incorrect');
        }
    });
}

// =====================================================
// FUNCTION 6: NEXT QUESTION
// =====================================================
function nextQuestion() {
    currentQuestionIndex++;
    
    // Check if there are more questions
    if (currentQuestionIndex < questions.length) {
        displayQuestion();
    } else {
        // Quiz completed - show results
        showResults();
    }
}

// =====================================================
// FUNCTION 7: SHOW RESULTS
// =====================================================
async function showResults() {
    try {
        // Show loading screen briefly
        showScreen('loading-screen');
        
        // Fetch results from backend
        const response = await fetch(`/api/results/${currentSessionId}`);
        const data = await response.json();
        
        // Show results screen
        showScreen('results-screen');
        
        // Display score
        document.getElementById('score').textContent = data.score;
        document.getElementById('total').textContent = data.total;
        document.getElementById('percentage').textContent = data.percentage + '%';
        
        // Choose emoji based on score percentage
        const resultEmoji = document.getElementById('result-emoji');
        if (data.percentage >= 80) {
            resultEmoji.textContent = '🎉';
        } else if (data.percentage >= 60) {
            resultEmoji.textContent = '😊';
        } else if (data.percentage >= 40) {
            resultEmoji.textContent = '🤔';
        } else {
            resultEmoji.textContent = '📚';
        }
        
        // Display detailed answers
        displayAnswersReview(data.answers);
        
    } catch (error) {
        console.error('Error loading results:', error);
        alert('Failed to load results. Please try again.');
    }
}

// =====================================================
// FUNCTION 8: DISPLAY ANSWERS REVIEW
// =====================================================
function displayAnswersReview(answers) {
    const reviewContainer = document.getElementById('answers-review');
    reviewContainer.innerHTML = ''; // Clear previous content
    
    answers.forEach(answer => {
        // Create answer card
        const card = document.createElement('div');
        card.className = `answer-card ${answer.is_correct ? 'correct' : 'incorrect'}`;
        
        // Build card content
        let cardHTML = `
            <div class="question-text">
                ${answer.question_number}. ${decodeHTML(answer.question)}
            </div>
            <div class="answer-text your-answer">
                <strong>Your answer:</strong> ${decodeHTML(answer.user_answer)}
            </div>
        `;
        
        // If wrong, show correct answer
        if (!answer.is_correct) {
            cardHTML += `
                <div class="answer-text correct-answer">
                    <strong>Correct answer:</strong> ${decodeHTML(answer.correct_answer)}
                </div>
            `;
        }
        
        // Add status badge
        cardHTML += `
            <span class="status ${answer.is_correct ? 'correct' : 'incorrect'}">
                ${answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
            </span>
        `;
        
        card.innerHTML = cardHTML;
        reviewContainer.appendChild(card);
    });
}

// =====================================================
// FUNCTION 9: RESTART QUIZ
// =====================================================
function restartQuiz() {
    // Reset all variables
    currentSessionId = null;
    questions = [];
    currentQuestionIndex = 0;
    selectedAnswer = null;
    
    // Reset next button text
    document.getElementById('next-btn').textContent = 'Next Question';
    
    // Go back to home screen
    showScreen('home-screen');
}

// =====================================================
// INITIALIZE APP WHEN PAGE LOADS
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Quiz App Loaded Successfully! 🎉');
    console.log('Ready to start quiz...');
});