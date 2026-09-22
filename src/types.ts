export interface LinkRow {
  id: number;
  short_code: string;
  original_url: string;
  created_at: Date;
  expires_at: Date | null;
}

export interface CreateLinkRequestBody {
  url?: unknown;
}

export interface CreateLinkResponseBody {
  shortCode: string;
  shortUrl: string;
}

export interface ErrorResponseBody {
  error: string;
}

export interface ClickEventsRow {
  id: number;
  short_code: string;
  time_stamp: Date;
  ip_address: string;
  user_agent: string;
}
