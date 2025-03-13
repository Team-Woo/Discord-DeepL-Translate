import { Client, EmbedBuilder, GatewayIntentBits, ContextMenuCommandBuilder, ApplicationCommandType, REST, Routes, MessageFlags } from 'discord.js';
import * as deepl from 'deepl-node';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for required environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

if (!DISCORD_TOKEN || !DEEPL_API_KEY) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ]
});

// Initialize DeepL translator
const translator = new deepl.Translator(DEEPL_API_KEY);

// Register context menu command for translation
const commands = [
  new ContextMenuCommandBuilder()
    .setName('Translate with DeepL')
    .setType(ApplicationCommandType.Message)
    .toJSON()
];

// Deploy commands when the bot is ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  try {
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
});

/**
 * Returns the full language name for a given DeepL language code.
 *
 * @param {string} langCode - The language code to convert.
 * @returns {string} The full language name corresponding to the provided code.
 */
function getLanguageFullName(langCode: string): string {
  // Normalize the language code to uppercase
  const normalizedCode = langCode.toUpperCase();

  const languages: Record<string, string> = {
    'BG': 'Bulgarian',
    'CS': 'Czech',
    'DA': 'Danish',
    'DE': 'German',
    'EL': 'Greek',
    'EN': 'English',
    'EN-GB': 'British English',
    'EN-US': 'American English',
    'ES': 'Spanish',
    'ET': 'Estonian',
    'FI': 'Finnish',
    'FR': 'French',
    'HU': 'Hungarian',
    'ID': 'Indonesian',
    'IT': 'Italian',
    'JA': 'Japanese',
    'KO': 'Korean',
    'LT': 'Lithuanian',
    'LV': 'Latvian',
    'NB': 'Norwegian',
    'NL': 'Dutch',
    'PL': 'Polish',
    'PT': 'Portuguese',
    'PT-BR': 'Brazilian Portuguese',
    'PT-PT': 'Portuguese',
    'RO': 'Romanian',
    'RU': 'Russian',
    'SK': 'Slovak',
    'SL': 'Slovenian',
    'SV': 'Swedish',
    'TR': 'Turkish',
    'UK': 'Ukrainian',
    'ZH': 'Chinese',
    'IN': 'Indonesian',
    'HI': 'Hindi'
  };

  // Check if we have the language code in our mapping
  if (languages[normalizedCode]) {
    return languages[normalizedCode];
  }

  // If not in our mapping, try to make it more readable
  // by converting "EN" to "English", etc.
  if (normalizedCode.length === 2) {
    return normalizedCode.charAt(0) + normalizedCode.charAt(1).toLowerCase();
  }

  // If all else fails, just return the code
  return langCode;
}

// Handle context menu interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isMessageContextMenuCommand()) return;

  if (interaction.commandName === 'Translate with DeepL') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const targetMessage = interaction.targetMessage;
      const textToTranslate = targetMessage.content;

      if (!textToTranslate) {
        await interaction.editReply('No text found to translate.');
        return;
      }

      // Get message author
      const messageAuthor = targetMessage.author;
      const authorName = targetMessage.member?.displayName || messageAuthor.username;
      const authorAvatar = messageAuthor.displayAvatarURL({ size: 128 });

      // Get target language from user's locale or default to English
      const userLocale = interaction.locale;
      const targetLang = mapLocaleToDeepl(userLocale);

      // Translate the text
      const result = await translator.translateText(textToTranslate, null, targetLang);

      // Get the full names of languages for the footer
      const sourceLanguage = getLanguageFullName(result.detectedSourceLang);
      const targetLanguage = getLanguageFullName(targetLang);

      // Create an embed with the translation
      const translationEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setAuthor({
          name: authorName,
          iconURL: authorAvatar
        })
        .setDescription(result.text)
        .setFooter({
          text: `Translated from ${sourceLanguage} to ${targetLanguage}`
        })
        .setTimestamp();

      await interaction.editReply({
        embeds: [translationEmbed]
      });
    } catch (error) {
      console.error('Translation error:', error);
      await interaction.editReply('An error occurred during translation.');
    }
  }
});

/**
 * Maps a Discord locale to a DeepL language code.
 *
 * @param {string} locale - The Discord locale.
 * @returns {deepl.TargetLanguageCode} The corresponding DeepL language code.
 */
function mapLocaleToDeepl(locale: string): deepl.TargetLanguageCode {
  const mapping: Record<string, deepl.TargetLanguageCode> = {
    'en-US': 'en-US',
    'en-GB': 'en-GB',
    'es-ES': 'es',
    'fr': 'fr',
    'de': 'de',
    'it': 'it',
    'ja': 'ja',
    'ko': 'ko',
    'pt-BR': 'pt-BR',
    'ru': 'ru',
    'zh-CN': 'zh'
  };

  return mapping[locale] || 'EN-US';
}

// Login to Discord
client.login(DISCORD_TOKEN);