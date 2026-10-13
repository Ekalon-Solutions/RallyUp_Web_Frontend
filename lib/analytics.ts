import { GOOGLE_ANALYTICS_MEASUREMENT_ID } from "./analytics-config";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

class WebAnalyticsService {
  /**
   * Log custom event
   */
  async logEvent(eventName: string, eventParams?: Record<string, any>): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      if (window.gtag) {
        window.gtag("event", eventName, eventParams);
      } else if (window.dataLayer) {
        window.dataLayer.push({ event: eventName, ...eventParams });
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`[WebAnalytics:logEvent] ${eventName}`, eventParams ?? {});
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[WebAnalytics] Failed to log event "${eventName}":`, error);
      }
    }
  }

  /**
   * Log page/screen view
   */
  async logPageView(path: string, title?: string): Promise<void> {
    await this.logEvent("page_view", {
      page_path: path,
      page_title: title || (typeof document !== "undefined" ? document.title : ""),
    });
  }

  /**
   * Log page enter with timestamp
   */
  async logPageEnter(path: string): Promise<void> {
    await this.logEvent("page_open", {
      page_path: path,
    });
  }

  /**
   * Log page exit with duration spent
   */
  async logPageExit(path: string, durationSeconds: number): Promise<void> {
    await this.logEvent("page_close", {
      page_path: path,
      duration_seconds: Math.max(0, Math.round(durationSeconds)),
    });
  }

  /**
   * Set user ID
   */
  async setUserId(userId: string | null): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      if (window.gtag) {
        window.gtag("config", GOOGLE_ANALYTICS_MEASUREMENT_ID, {
          user_id: userId,
          send_page_view: false,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[WebAnalytics] Failed to set user ID:", error);
      }
    }
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      if (window.gtag) {
        window.gtag("set", "user_properties", properties);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[WebAnalytics] Failed to set user properties:", error);
      }
    }
  }

  /**
   * Set user profile
   */
  async setUserProfile(user: { id?: string; role?: string; clubId?: string }): Promise<void> {
    if (user.id) {
      await this.setUserId(user.id);
    }
    const props: Record<string, any> = {};
    if (user.role) props.user_role = user.role;
    if (user.clubId) props.active_club_id = user.clubId;
    if (Object.keys(props).length > 0) {
      await this.setUserProperties(props);
    }
  }

  /**
   * Auth actions
   */
  async logLogin(method: string, role?: string): Promise<void> {
    await this.logEvent("login", { method, role: role || "guest" });
  }

  async logSignUp(method: string, role?: string): Promise<void> {
    await this.logEvent("sign_up", { method, role: role || "guest" });
  }

  async logLogout(): Promise<void> {
    await this.logEvent("logout", {});
    await this.setUserId(null);
  }
}

export const analytics = new WebAnalyticsService();
