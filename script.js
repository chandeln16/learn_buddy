// ==========================================
// 🦉 LEARN BUDDY - FINAL SECURE SCRIPT.JS (PYTHON BACKEND CONNECTED)
// ==========================================

let currentCategoryData = []; 
let currentIndex = 0;
let isPaused = false;
let currentTimerInterval = null;

// 🔗 Aapke local Python backend ka address
const BACKEND_URL = "http://127.0.0.1:8000";

// 1️⃣ Backend se Google Sheet ka data lana
async function getSheetText() {
    try {
        let response = await fetch(`${BACKEND_URL}/api/sheet-data`);
        let data = await response.json();
        return data.csv_data;
    } catch (error) {
        console.error("Backend connect nahi ho raha:", error);
        alert("Python Backend se connect nahi ho pa raha hai. Kya aapne FastAPI server run kiya hai?");
        return null;
    }
}

// 2️⃣ Page khulte hi Google Sheet se categories lana (via Python)
window.onload = async function() {
    await loadCategoriesIntoDropdown();
};

async function loadCategoriesIntoDropdown() {
    let csvData = await getSheetText();
    if (!csvData) return;

    let rows = csvData.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
    
    if (rows.length > 0) {
        let headers = rows[0]; 
        let selectBox = document.getElementById('category');
        
        if (!selectBox) return;
        selectBox.innerHTML = "";
        
        // 🎲 Random option
        let randomOption = document.createElement('option');
        randomOption.value = "random";
        randomOption.textContent = "🎲 Random (All Categories)";
        randomOption.selected = true; 
        selectBox.appendChild(randomOption);
        
        headers.forEach(categoryName => {
            if (categoryName && categoryName !== "") {
                let option = document.createElement('option');
                option.value = categoryName.toLowerCase().trim();
                option.textContent = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
                selectBox.appendChild(option);
            }
        });
        console.log("Categories loaded securely via Backend!");
    }
}

// 3️⃣ App Start Karne ka Function
function startApp() {
    let userName = document.getElementById('userName').value.trim();
    let categorySelect = document.getElementById('category').value;
    
    if (userName === "") {
        alert("Pehle apna naam toh likhiye! 😊");
        return;
    }
    
    document.getElementById('home-screen').classList.remove('active');
    document.getElementById('greeting-screen').classList.add('active');
    
    document.getElementById('greeting-text').innerText = `Hello, ${userName}! 👋`;
    document.getElementById('quote-text').innerText = "“Learning is a treasure that will follow its owner everywhere.” 🚀";
    
    setTimeout(() => {
        document.getElementById('greeting-screen').classList.remove('active');
        document.getElementById('learning-screen').classList.add('active');
        loadSheetData(categorySelect);
    }, 2500);
}

// 4️⃣ Google Sheet se Words Fetch karna (via Python)
async function loadSheetData(selectedCategory) {
    let csvData = await getSheetText();
    if (!csvData) return;

    let rows = csvData.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
    
    if (rows.length === 0) return;
    
    let headers = rows[0].map(h => h.toLowerCase().trim());
    let targetCategory = selectedCategory.toLowerCase().trim();
    
    currentCategoryData = [];
    
    if (targetCategory === "random") {
        for (let j = 0; j < headers.length; j++) {
            for (let i = 1; i < rows.length; i++) {
                let word = rows[i][j];
                if (word && word !== "") {
                    let formattedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                    if (!currentCategoryData.some(item => item.word === formattedWord)) {
                        currentCategoryData.push({ word: formattedWord });
                    }
                }
            }
        }
        currentCategoryData.sort(() => Math.random() - 0.5);
        
    } else {
        let colIndex = -1;
        for (let j = 0; j < headers.length; j++) {
            if (headers[j] === targetCategory) {
                colIndex = j;
                break;
            }
        }
        
        if (colIndex !== -1) {
            for (let i = 1; i < rows.length; i++) {
                let word = rows[i][colIndex];
                if (word && word !== "") {
                    let formattedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                    currentCategoryData.push({ word: formattedWord });
                }
            }
        }
    }
    
    if (currentCategoryData.length > 0) {
        currentIndex = 0;
        runRealLearningLoop();
    } else {
        alert(`Koi words nahi mile!`);
    }
}

// 5️⃣ Secure Image Fetcher (Python backend Pexels se image layega)
async function getWordImageUrl(word) {
    let cleanWord = word.trim();
    
    // Dropdown se current selected category uthayein
    let selectedCategory = document.getElementById('category').value;
    
    try {
        // Word ke sath category bhi backend ko bhej rahe hain
        let response = await fetch(`${BACKEND_URL}/api/get-image?word=${encodeURIComponent(cleanWord)}&category=${encodeURIComponent(selectedCategory)}`);
        let data = await response.json();
        return data.image_url; 
    } catch (error) {
        console.error("Backend image error:", error);
        return `https://images.unsplash.com/featured/?{encodeURIComponent(cleanWord)}`;
    }
}

// 6️⃣ Main Learning Loop
async function runRealLearningLoop() {
    while (isPaused) {
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (currentIndex >= currentCategoryData.length) {
        alert("Aapne is category ke saare words successfully complete kar liye hain! 🎉");
        return;
    }

    let currentItem = currentCategoryData[currentIndex];
    
    const timerDisplay = document.getElementById('timer-display');
    const answerContainer = document.getElementById('answer-container');
    const questionText = document.querySelector('.question-text');
    const wordElement = document.getElementById('correct-word');
    const imageElement = document.getElementById('word-image');
    const imageLoader = document.getElementById('image-loader');

    answerContainer.classList.add('hidden');
    timerDisplay.classList.add('hidden');
    if(questionText) questionText.innerText = "GET READY...";
    
    if (imageLoader) imageLoader.classList.remove('hidden');

    let imageUrlPromise = getWordImageUrl(currentItem.word);
    
    let [imageUrl] = await Promise.all([
        imageUrlPromise,
        new Promise(resolve => setTimeout(resolve, 2000))
    ]);

    while (isPaused) {
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    await new Promise((resolve) => {
        let img = new Image();
        img.src = imageUrl;
        
        img.onload = () => {
            if (imageElement) imageElement.src = imageUrl;
            resolve();
        };
        
        img.onerror = () => {
            let fallbackUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80";
            if (imageElement) imageElement.src = fallbackUrl;
            resolve();
        };
    });

    if (imageLoader) imageLoader.classList.add('hidden');

    timerDisplay.classList.remove('hidden');
    timerDisplay.innerText = "...";
    if(questionText) questionText.innerText = "WHAT IS THIS CALLED?";
    playAudio("What is this called?");

    let count = 1;
    
    if (currentTimerInterval) clearInterval(currentTimerInterval);

    currentTimerInterval = setInterval(async () => {
        while (isPaused) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        if (count <= 3) {
            timerDisplay.innerText = count;
            triggerVibration(20);
            count++;
        } else {
            clearInterval(currentTimerInterval);
            timerDisplay.classList.add('hidden');
            answerContainer.classList.remove('hidden');
            if(questionText) questionText.innerText = "IT IS CALLED...";

            wordElement.innerText = currentItem.word;
            playAudio(currentItem.word);

            setTimeout(async () => {
                while (isPaused) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                currentIndex++;
                runRealLearningLoop();
            }, 3000);
        }
    }, 1000);
}

// 7️⃣ Audio Helper (Youdao Dictionary API - 100% Free & Fast)
function playAudio(text) {
    try {
        let cleanText = text.trim();
        let audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanText)}&type=2`;
        let audio = new Audio(audioUrl);
        
        audio.play().catch(error => {
            console.log("Audio play error:", error);
        });
    } catch (error) {
        console.log("Audio exception:", error);
    }
}

// 8️⃣ Vibration Helper
function triggerVibration(duration) {
    if ("vibrate" in navigator) {
        navigator.vibrate(duration);
    }
}

// 9️⃣ Pause & Manual Controls
function togglePause() {
    isPaused = !isPaused;
    let pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        pauseBtn.innerText = isPaused ? "Resume" : "Pause";
    }
}

let manualNavTimeout = null;

function prevWord() {
    if (currentIndex > 0) {
        currentIndex--;
        handleManualNavigation();
    } else {
        alert("Yeh pehla word hai!");
    }
}

function nextWord() {
    if (currentIndex < currentCategoryData.length - 1) {
        currentIndex++;
        handleManualNavigation();
    } else {
        alert("Aapne is category ke saare words complete kar liye hain! 🎉");
    }
}

async function handleManualNavigation() {
    if (currentTimerInterval) clearInterval(currentTimerInterval);
    if (manualNavTimeout) clearTimeout(manualNavTimeout);

    let currentItem = currentCategoryData[currentIndex];
    
    const timerDisplay = document.getElementById('timer-display');
    const answerContainer = document.getElementById('answer-container');
    const questionText = document.querySelector('.question-text');
    const wordElement = document.getElementById('correct-word');
    const imageElement = document.getElementById('word-image');
    const imageLoader = document.getElementById('image-loader');

    timerDisplay.classList.add('hidden');
    answerContainer.classList.remove('hidden');
    if(questionText) questionText.innerText = `WORD ${currentIndex + 1} OF ${currentCategoryData.length}`;
    
    if (imageLoader) imageLoader.classList.remove('hidden');

    let imageUrl = await getWordImageUrl(currentItem.word);

    await new Promise((resolve) => {
        let img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            if (imageElement) imageElement.src = imageUrl;
            resolve();
        };
        img.onerror = () => {
            if (imageElement) imageElement.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80";
            resolve();
        };
    });

    if (imageLoader) imageLoader.classList.add('hidden');

    wordElement.innerText = currentItem.word;
    playAudio(currentItem.word);

    manualNavTimeout = setTimeout(() => {
        if (!isPaused) {
            currentIndex++; 
            runRealLearningLoop(); 
        }
    }, 3000);
}