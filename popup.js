const extractBtn = document.getElementById('extractBtn');
const cancelBtn = document.getElementById('cancelBtn');
const status = document.getElementById('status');
const resultContainer = document.getElementById('resultContainer');
const promptOutput = document.getElementById('promptOutput');
const copyBtn = document.getElementById('copyBtn');

/**
 * Formats the extracted review data into an AI prompt.
 * @param {Object} data - The filtered review data containing problems and requests.
 * @returns {string} The formatted prompt.
 */
function generatePrompt(data) {
  const problems = data.problems.length > 0 ? data.problems.join('\n\n') : 'No significant negative reviews found.';
  const requests = data.requests.length > 0 ? data.requests.join('\n\n') : 'No significant feature requests found.';

  return `Analyze the following app reviews and provide deep insights.

NEGATIVE REVIEWS:
${problems}

FEATURE REQUESTS:
${requests}

TASK:
1. Identify the most common user problems
2. Identify missing or requested features
3. Suggest improvements for the app
4. Identify startup or business opportunities based on gaps
5. Suggest how a new competitor app could outperform this one`;
}

// Click listener for the extraction button
extractBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      status.innerText = "Error: No active tab found.";
      return;
    }

    // Ensure we are on a valid Google Play page
    if (!tab.url || !tab.url.includes('play.google.com/store/apps/details')) {
      status.innerText = "Please navigate to a Google Play app details page.";
      status.classList.remove('hidden');
      return;
    }

    extractBtn.disabled = true;
    cancelBtn.classList.remove('hidden');
    status.classList.remove('hidden');
    status.innerText = "Finding reviews and scrolling...";
    resultContainer.classList.add('hidden');

    chrome.tabs.sendMessage(tab.id, { action: "extract" }, (response) => {
      extractBtn.disabled = false;
      cancelBtn.classList.add('hidden');

      // Handle potential connection error (e.g. content script not loaded)
      if (chrome.runtime.lastError) {
        status.innerText = "Error: Could not connect to the page. Try refreshing the tab.";
        console.error(chrome.runtime.lastError);
        return;
      }

      if (response && response.status === "success") {
        const prompt = generatePrompt(response.data);
        promptOutput.value = prompt;
        status.innerText = "Done!";
        resultContainer.classList.remove('hidden');
      } else if (response && response.status === "cancelled") {
        status.innerText = "Extraction cancelled.";
      } else {
        status.innerText = "Error: Extraction failed or no reviews found.";
      }
    });
  } catch (err) {
    status.innerText = "An unexpected error occurred.";
    extractBtn.disabled = false;
    cancelBtn.classList.add('hidden');
    console.error(err);
  }
});

// Click listener for the cancel button
cancelBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: "cancel" });
    status.innerText = "Cancelling...";
    cancelBtn.classList.add('hidden');
  }
});

// Listen for progress updates from the content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "progress") {
    status.innerText = `Extracted ${msg.count}/200 reviews...`;
  }
});

// Click listener for the copy button
copyBtn.addEventListener('click', async () => {
  const text = promptOutput.value;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older environments or specific restrictions
      promptOutput.select();
      document.execCommand('copy');
    }
    
    const originalText = copyBtn.innerText;
    copyBtn.innerText = "Copied!";
    copyBtn.disabled = true;
    
    setTimeout(() => {
      copyBtn.innerText = originalText;
      copyBtn.disabled = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
    status.innerText = "Failed to copy to clipboard.";
  }
});
