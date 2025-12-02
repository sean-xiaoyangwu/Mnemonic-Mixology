# Mnemonic Mixology - Installation Guide

## Overview
Mnemonic Mixology is a React application that uses Google's Gemini AI to analyze your spoken day, detect your emotions, and generate a custom cocktail recipe visualized on a dashboard.

To run this application on your local computer, follow these steps.

---

## Prerequisites
1. **Node.js**: Download and install the LTS version from [nodejs.org](https://nodejs.org/).
2. **Gemini API Key**: Get a free API key from [Google AI Studio](https://aistudio.google.com/).

---

## Step-by-Step Installation

### 1. Create the Project
Open your Terminal (Command Prompt on Windows, Terminal on Mac) and run the following commands to create a new React project using Vite:

```bash
# Create a new project (press Enter to accept defaults)
npm create vite@latest mnemonic-mixology -- --template react-ts

# Enter the project folder
cd mnemonic-mixology

# Install standard dependencies
npm install
```

### 2. Install App Dependencies
Install the specific libraries used by this app (AI SDK, Charts, Icons):

```bash
npm install @google/genai lucide-react recharts
```

### 3. Setup Files
Copy the downloaded files into your new `mnemonic-mixology` folder:

1.  **`index.html`**: Replace the file in the root folder.
    *   *Note: Ensure the `<script type="module" src="/src/main.tsx"></script>` line remains inside the `<body>` tag.*
2.  **`src/App.tsx`**: Replace the existing file.
3.  **`src/types.ts`**: Place this file in the `src` folder.
4.  **`src/components/`**: Create this folder and add `MoodRadar.tsx` and `CocktailDisplay.tsx`.
5.  **`src/services/`**: Create this folder and add `geminiService.ts`.

### 4. Configure API Key
1.  In the root folder of your project (next to `package.json`), create a new file named `.env`.
2.  Open `.env` in a text editor and paste your API key like this:

```env
VITE_API_KEY=your_actual_api_key_here
```

### 5. Run the App
In your terminal, run:

```bash
npm run dev
```

You will see a Local URL (e.g., `http://localhost:5173`). Open this link in your browser to start the application.

---

## Troubleshooting
*   **Microphone Error**: Ensure you allow microphone permissions in your browser.
*   **"API Key Missing"**: Make sure your `.env` file is named exactly `.env` and you restarted the server (`Ctrl+C` then `npm run dev`) after creating it.
