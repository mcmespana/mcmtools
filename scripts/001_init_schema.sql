-- MCM Tools Engine — schema inicial
-- Una tabla "tools" con campos de presentación + un blob jsonb "config"
-- (trigger, outputType, userVars, steps, filenameTokens, dictionary).
-- Tabla "tool_runs" para histórico/stats.

CREATE TABLE IF NOT EXISTS tools (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  tagline      TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  icon         TEXT NOT NULL DEFAULT 'fileText',
  icon_bg      TEXT NOT NULL DEFAULT '#C7B8FF',
  icon_color   TEXT NOT NULL DEFAULT '#0A0A0A',
  status       TEXT NOT NULL DEFAULT 'draft',  -- active | idle | draft | archived
  featured     BOOLEAN NOT NULL DEFAULT FALSE,
  span_col     INTEGER NOT NULL DEFAULT 4,
  span_row     INTEGER NOT NULL DEFAULT 1,
  tint         TEXT,
  glow         TEXT,
  input_type   TEXT NOT NULL DEFAULT 'archivo',
  input_icon   TEXT NOT NULL DEFAULT 'upload',
  output_type  TEXT NOT NULL DEFAULT 'archivo',
  output_icon  TEXT NOT NULL DEFAULT 'download',
  position     INTEGER NOT NULL DEFAULT 0,
  config       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tools_position ON tools (position);
CREATE INDEX IF NOT EXISTS idx_tools_status   ON tools (status);

CREATE TABLE IF NOT EXISTS tool_runs (
  id              BIGSERIAL PRIMARY KEY,
  tool_id         TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  duration_ms     INTEGER NOT NULL DEFAULT 0,
  detected_count  INTEGER NOT NULL DEFAULT 0,
  errors          INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_runs_tool_id ON tool_runs (tool_id);
