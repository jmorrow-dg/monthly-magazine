-- 16-page magazine restructure: add section dividers, expand page limit

ALTER TABLE issue_pages DROP CONSTRAINT IF EXISTS issue_pages_page_number_check;
ALTER TABLE issue_pages ADD CONSTRAINT issue_pages_page_number_check CHECK (page_number BETWEEN 1 AND 16);

ALTER TABLE issue_pages DROP CONSTRAINT IF EXISTS issue_pages_page_type_check;
ALTER TABLE issue_pages ADD CONSTRAINT issue_pages_page_type_check CHECK (page_type IN (
  'cover', 'editorial', 'cover-story-intro', 'cover-story-analysis',
  'cover-story-implications', 'strategic-implications', 'enterprise',
  'industry-watch', 'tools', 'playbook', 'playbook-continued',
  'strategic-signals', 'personalized-insight', 'closing',
  'section-divider',
  'developments', 'implications', 'playbooks'
));
