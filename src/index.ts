import { Client, EmbedBuilder, GatewayIntentBits, ContextMenuCommandBuilder, ApplicationCommandType, REST, Routes, MessageFlags, Message,  Embed } from 'discord.js';
import * as deepl from 'deepl-node';
import dotenv from 'dotenv';
import { TextResult } from 'deepl-node';

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

    console.log(commands)

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

/**
 * Extracts all translatable text from an embed
 * @param embed The Discord embed to extract text from
 * @returns An object containing the extracted text and its location in the embed
 */
function extractEmbedText(embed: Embed): { text: string; path: string }[] {
  const textParts: { text: string; path: string }[] = [];

  // Extract title
  if (embed.title) {
    textParts.push({ text: embed.title, path: 'title' });
  }

  // Extract description
  if (embed.description) {
    textParts.push({ text: embed.description, path: 'description' });
  }

  // Extract author name
  if (embed.author?.name) {
    textParts.push({ text: embed.author.name, path: 'author.name' });
  }

  // Extract footer text
  if (embed.footer?.text) {
    textParts.push({ text: embed.footer.text, path: 'footer.text' });
  }

  // Extract fields
  if (embed.fields && embed.fields.length > 0) {
    embed.fields.forEach((field, index) => {
      if (field.name) {
        textParts.push({ text: field.name, path: `fields.${index}.name` });
      }
      if (field.value) {
        textParts.push({ text: field.value, path: `fields.${index}.value` });
      }
    });
  }

  return textParts;
}

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

// Handle context menu interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isMessageContextMenuCommand()) return;

  if (interaction.commandName === 'Translate with DeepL') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const targetMessage = interaction.targetMessage;
      
      // Get message author
      const messageAuthor = targetMessage.author;
      const authorName = targetMessage.member?.displayName || messageAuthor.username;
      const authorAvatar = messageAuthor.displayAvatarURL({ size: 128 });

      // Get target language from user's locale or default to English
      const userLocale = interaction.locale;
      const targetLang = mapLocaleToDeepl(userLocale);

      // Collection to store all texts to translate
      const textsToTranslate: { text: string; type: string; path?: string }[] = [];
      
      // Add message content if it exists
      if (targetMessage.content) {
        textsToTranslate.push({ 
          text: targetMessage.content, 
          type: 'content' 
        });
      }
      
      // Add embed content if embeds exist
      if (targetMessage.embeds && targetMessage.embeds.length > 0) {
        targetMessage.embeds.forEach((embed, embedIndex) => {
          const embedTexts = extractEmbedText(embed);
          embedTexts.forEach(item => {
            textsToTranslate.push({
              text: item.text,
              type: 'embed',
              path: `${embedIndex}.${item.path}`
            });
          });
        });
      }
      
      // If no text to translate, return an error
      if (textsToTranslate.length === 0) {
        await interaction.editReply('No text found to translate.');
        return;
      }
      
      // Extract just the texts for the API call
      const textArray = textsToTranslate.map(item => item.text);
      
      // Translate all texts in a single API call
      const translationResults = await translator.translateText(textArray, null, targetLang);
      
      // Map translation results back to their original contexts
      const translationMap = Array.isArray(translationResults) 
        ? translationResults.map((result, index) => ({
            original: textsToTranslate[index],
            translated: result.text,
            detectedLanguage: result.detectedSourceLang
          }))
        : [{
            // translator.translateText seems to not be defined completely correctly, or I just didnt look hard enough. If i misunderstand how it works this should handle it.
            original: textsToTranslate[0],
            translated: (translationResults as TextResult).text,
            detectedLanguage: (translationResults as TextResult).detectedSourceLang
          }];
      
      // Get message content translation if it exists
      const contentTranslation = translationMap.find(item => item.original.type === 'content');
      
      // Create embeds array for the response
      const responseEmbeds = [];
      
      // If there was message content, create an embed for it
      if (contentTranslation) {
        const contentEmbed = new EmbedBuilder()
          .setColor(0x0099FF)
          .setAuthor({
            name: authorName,
            iconURL: authorAvatar
          })
          .setDescription(contentTranslation.translated)
          .setFooter({
            text: `Translated from ${getLanguageFullName(contentTranslation.detectedLanguage)} to ${getLanguageFullName(targetLang)}`
          })
          .setTimestamp();
        
        responseEmbeds.push(contentEmbed);
      }
      
      // Reconstruct each original embed with translated text
      if (targetMessage.embeds && targetMessage.embeds.length > 0) {
        targetMessage.embeds.forEach((originalEmbed, embedIndex) => {
          // Create a new embed that copies the original structure
          const translatedEmbed = EmbedBuilder.from(originalEmbed);
          
          // Apply translations to each part of the embed
          translationMap.forEach(translation => {
            if (translation.original.type === 'embed' && translation.original.path) {
              const [index, ...pathParts] = translation.original.path.split('.');
              if (parseInt(index) === embedIndex) {
                const path = pathParts.join('.');
                
                // Apply translation based on the path
                if (path === 'title') {
                  translatedEmbed.setTitle(translation.translated);
                } else if (path === 'description') {
                  translatedEmbed.setDescription(translation.translated);
                } else if (path === 'author.name' && originalEmbed.author) {
                  translatedEmbed.setAuthor({
                    name: translation.translated,
                    iconURL: originalEmbed.author.iconURL,
                    url: originalEmbed.author.url
                  });
                } else if (path === 'footer.text' && originalEmbed.footer) {
                  translatedEmbed.setFooter({
                    text: translation.translated,
                    iconURL: originalEmbed.footer.iconURL
                  });
                } else if (path.startsWith('fields.')) {
                  const [_, fieldIndex, fieldPart] = path.split('.');
                  const fieldIdx = parseInt(fieldIndex);
                  
                  // Get all existing fields
                  const fields = translatedEmbed.data.fields || [];
                  
                  // Ensure the field exists
                  if (fields[fieldIdx]) {
                    // Create a new field with the translated content
                    if (fieldPart === 'name') {
                      fields[fieldIdx].name = translation.translated;
                    } else if (fieldPart === 'value') {
                      fields[fieldIdx].value = translation.translated;
                    }
                  }
                  
                  // Update the fields in the embed
                  translatedEmbed.setFields(fields);
                }
              }
            }
          });
          
          // Add a footer note about translation if it doesn't already have one
          if (!translatedEmbed.data.footer) {
            translatedEmbed.setFooter({
              text: `Translated from ${getLanguageFullName(translationMap[0].detectedLanguage)} to ${getLanguageFullName(targetLang)}`
            });
          }
          
          responseEmbeds.push(translatedEmbed);
        });
      }
      
      // Send all the translated embeds
      await interaction.editReply({
        embeds: responseEmbeds
      });
      
    } catch (error) {
      console.error('Translation error:', error);
      await interaction.editReply('An error occurred during translation.');
    }
  }
});

// Login to Discord
client.login(DISCORD_TOKEN);