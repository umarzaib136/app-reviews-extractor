# App Review Intelligence Extractor 🚀

A powerful Chrome Extension (Manifest V3) designed for product managers, researchers, and developers to transform thousands of raw Google Play Store reviews into structured, AI-ready intelligence in seconds.

![App Review Intelligence Extractor Screenshot](screenshot.png)

## ✨ Features

- **Automated Extraction**: Programmatically scrolls and extracts up to 200 reviews from any Google Play Store app page.
- **Smart Filtering**: Automatically categorizes reviews into "Negative Reviews (Problems)" and "Feature Requests" using keyword analysis and star ratings.
- **AI-Ready Prompts**: Generates a perfectly formatted prompt that you can paste directly into ChatGPT, Claude, or Gemini for deep analysis.
- **Competitive Analysis**: Helps identify market gaps, user pain points, and opportunities to outperform competitors.

## 🛠️ How it Works

1. **Scraping**: Uses a robust `MutationObserver` and targeted DOM traversal to navigate Google Play's dynamic UI.
2. **Filtering**: Applies a multi-layered filtering engine to isolate actionable feedback.
3. **Generation**: Compiles the data into a structured template designed for LLMs to provide the highest quality insights.

## 📦 Installation

Since this is a developer-focused tool, you can install it via Chrome's "Developer Mode":

1. **Download/Clone the Repo**:
   ```bash
   git clone https://github.com/umarzaib136/app-reviews-extractor.git
   ```
2. **Open Chrome Extensions**:
   Navigate to `chrome://extensions/` in your browser.
3. **Enable Developer Mode**:
   Toggle the switch in the top-right corner.
4. **Load Unpacked**:
   Click the **"Load unpacked"** button and select the `app reviews extractor` folder from this repository.
5. **Pin the Extension**:
   Click the puzzle piece icon in your toolbar and pin "App Review Intelligence Extractor" for easy access.

## 🚀 Usage

1. Navigate to any app on the [Google Play Store](https://play.google.com/store/apps/details?id=com.whatsapp).
2. Click the extension icon in your toolbar.
3. Click **"Extract & Analyze Reviews"**.
4. The extension will automatically open the "See all reviews" modal and begin scrolling.
5. Once complete, click **"Copy Prompt"** and paste it into your favorite AI model.

## 🛡️ Privacy & Security

- **Local Execution**: All processing happens entirely within your browser.
- **No Data Collection**: No reviews or personal data are ever sent to external servers.
- **Minimal Permissions**: Only requires `activeTab` and `scripting` permissions to function on the page you are viewing.

---
Made with love by [Umar Zaib](https://github.com/umarzaib136)
