# Discord DeepL Translation Bot

A Discord bot that allows users to translate messages using DeepL translation service via a right-click context menu.

## Features

- Right-click on any message and select "Translate with DeepL"
- Automatic source language detection
- Translates to the language based on the user's Discord locale
- Simple, intuitive interface through Discord's context menu

## Prerequisites

- Node.js (version 16.9.0 or higher) - _Not needed if using Docker_
- A Discord Bot Token
- A DeepL API Key
- Docker and Docker Compose (if running with Docker)

## Installation

### Standard Installation

1. Clone this repository:

   ```bash
   git clone <your-repository-url>
   cd deepl
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your actual Discord token and DeepL API key.

### Docker Installation

1. Clone this repository:

   ```bash
   git clone <your-repository-url>
   cd deepl
   ```

2. Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your actual Discord token and DeepL API key.

## Usage

### Running with Node.js

1. Build the TypeScript code:

   ```bash
   npm run build
   ```

2. Start the bot:

   ```bash
   npm start
   ```

3. For development with auto-reload:
   ```bash
   npm run dev
   ```

### Running with Docker

1. Build and start the Docker container:

   ```bash
   docker compose up -d
   ```

   This will build the Docker image and start the container in detached mode.

2. View logs:

   ```bash
   docker compose logs -f
   ```

3. Stop the container:

   ```bash
   docker compose down
   ```

4. Rebuild the container (after code changes):
   ```bash
   docker compose up -d --build
   ```

## Setting Up a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under the "Privileged Gateway Intents" section, enable:
   - Server Members Intent
   - Message Content Intent
5. Copy the bot token and add it to your `.env` file
6. Go to the "OAuth2" tab, then "URL Generator"
7. Select the following scopes:
   - `bot`
   - `applications.commands`
8. For bot permissions, select:
   - Read Messages/View Channels
   - Send Messages
   - Read Message History
   - Use Application Commands
9. Use the generated URL to invite the bot to your server

## Getting a DeepL API Key

1. Create an account at [DeepL API](https://www.deepl.com/pro-api)
2. Subscribe to a plan (they have a free tier with up to 500,000 characters per month)
3. Get your API key from the account dashboard
4. Add the API key to your `.env` file

## Using the Bot

Once the bot is in your server and running:

1. Right-click on any message
2. In the Apps submenu, select "Translate with DeepL"
3. The bot will respond with the original text and its translation

## Available Languages

The bot automatically detects the source language and translates to the language matching the user's Discord locale. Supported target languages include:

- English (American and British)
- Spanish
- French
- German
- Italian
- Japanese
- Korean
- Portuguese (Brazilian)
- Russian
- Chinese
