-- ============================================
-- Content Management Database Schema
-- Tables: content_modules, content_lessons, content_lesson_details,
--         content_changelog, content_roadmap_phases, content_roadmap_items,
--         content_faq, content_support_paths
-- Purpose: Store app content for dynamic management via admin UI
-- ============================================

-- ============================================
-- Table: content_modules
-- Learning modules (e.g. Order Types, Order Book)
-- ============================================

CREATE TABLE content_modules (
  id SERIAL PRIMARY KEY,
  module_slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  simulator_kind TEXT CHECK (simulator_kind IN ('spot', 'futures')),
  coming_soon BOOLEAN NOT NULL DEFAULT false,
  wallet_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_modules_sort ON content_modules(sort_order);

-- ============================================
-- Table: content_lessons
-- Lessons within a learning module
-- ============================================

CREATE TABLE content_lessons (
  id SERIAL PRIMARY KEY,
  module_slug TEXT NOT NULL REFERENCES content_modules(module_slug) ON DELETE CASCADE,
  lesson_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  simulator_preset JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_slug, lesson_slug)
);

CREATE INDEX idx_content_lessons_module ON content_lessons(module_slug, sort_order);

-- ============================================
-- Table: content_lesson_details
-- Polymorphic lesson content (order type details OR order book details)
-- Uses JSONB `content` column with `detail_type` discriminator
-- ============================================

CREATE TABLE content_lesson_details (
  id SERIAL PRIMARY KEY,
  module_slug TEXT NOT NULL,
  lesson_slug TEXT NOT NULL,
  detail_type TEXT NOT NULL CHECK (detail_type IN ('order_type', 'order_book')),
  emoji TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_slug, lesson_slug),
  FOREIGN KEY (module_slug, lesson_slug) REFERENCES content_lessons(module_slug, lesson_slug) ON DELETE CASCADE
);

-- ============================================
-- Table: content_changelog
-- Changelog entries across product/design/dev categories
-- ============================================

CREATE TABLE content_changelog (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('product', 'design', 'dev')),
  date DATE NOT NULL,
  tag_label TEXT NOT NULL,
  tag_color TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  credit TEXT,
  source TEXT,
  test_href TEXT,
  test_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_changelog_category_date ON content_changelog(category, date DESC);

-- ============================================
-- Table: content_roadmap_phases
-- Roadmap phases with status tracking
-- ============================================

CREATE TABLE content_roadmap_phases (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('done', 'next', 'future')),
  subtitle TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: content_roadmap_items
-- Line items within a roadmap phase
-- ============================================

CREATE TABLE content_roadmap_items (
  id SERIAL PRIMARY KEY,
  phase_id INTEGER NOT NULL REFERENCES content_roadmap_phases(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_content_roadmap_items_phase ON content_roadmap_items(phase_id, sort_order);

-- ============================================
-- Table: content_faq
-- FAQ items for the help page
-- ============================================

CREATE TABLE content_faq (
  id SERIAL PRIMARY KEY,
  value TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: content_support_paths
-- Support path cards for the help page
-- ============================================

CREATE TABLE content_support_paths (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Auto-update triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_modules_updated_at
  BEFORE UPDATE ON content_modules
  FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER trigger_content_lessons_updated_at
  BEFORE UPDATE ON content_lessons
  FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER trigger_content_lesson_details_updated_at
  BEFORE UPDATE ON content_lesson_details
  FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER trigger_content_changelog_updated_at
  BEFORE UPDATE ON content_changelog
  FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER trigger_content_roadmap_phases_updated_at
  BEFORE UPDATE ON content_roadmap_phases
  FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER trigger_content_faq_updated_at
  BEFORE UPDATE ON content_faq
  FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER trigger_content_support_paths_updated_at
  BEFORE UPDATE ON content_support_paths
  FOR EACH ROW EXECUTE FUNCTION update_content_updated_at();
