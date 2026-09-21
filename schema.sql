CREATE TABLE IF NOT EXISTS links (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(12) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_links_short_code ON links (short_code);

-- click_events comes later, once the async worker step is in place.
-- Adding it now would tempt you to write to it synchronously, which
-- defeats the point of that exercise.
CREATE TABLE IF NOT EXISTS click_events (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(12) NOT NULL ,
    time_stamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address inet NOT NULL,
    user_agent VARCHAR(256) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_click_events_short_code on click_events(short_code);