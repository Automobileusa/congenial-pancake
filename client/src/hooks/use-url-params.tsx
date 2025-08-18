import { useMemo } from "react";
import { useLocation } from "wouter";

export function useUrlParams() {
  const [location] = useLocation();
  
  const params = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paramObj: Record<string, string> = {};
    
    searchParams.forEach((value, key) => {
      paramObj[key] = value;
    });
    
    return paramObj;
  }, [location]);

  return params;
}

export function useEmailFromUrl(): { email: string; domain: string } {
  const params = useUrlParams();
  
  return useMemo(() => {
    const email = params.email || "";
    const domain = email.includes("@") ? email.split("@")[1] : "";
    
    return { email, domain };
  }, [params.email]);
}
