insert into public.tenants (id, slug, name) values
  ('11111111-1111-4111-8111-111111111111', 'nordwind', 'Nordwind Bank'),
  ('22222222-2222-4222-8222-222222222222', 'roastworks', 'Roastworks Coffee');

insert into public.memberships (user_id, tenant_id) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '22222222-2222-4222-8222-222222222222');

insert into public.vision_guidelines (id, version, principles, quality_bar, avoid, is_active) values (
  '33333333-3333-4333-8333-333333333333',
  1,
  array[
    'Clarity over cleverness',
    'Human warmth in professional contexts',
    'Purposeful negative space'
  ],
  'Editorial-grade imagery suitable for premium European brands: sharp focus, believable lighting, no stock-photo clichés.',
  array['watermarks', 'logos unless requested', 'distorted anatomy', 'busy clutter'],
  true
);

insert into public.brand_profiles (
  id, tenant_id, version, visual_style, composition, moods, avoid, content_pages, segments, palette, is_active
) values (
  '44444444-4444-4444-8444-444444444444',
  '11111111-1111-4111-8111-111111111111',
  1,
  'Scandinavian minimal fintech: cool neutrals, soft daylight, restrained geometry, trustworthy and calm.',
  'Center-weighted subjects with generous margins; subtle depth of field.',
  array['calm', 'trustworthy'],
  array['neon colors', 'playful cartoon aesthetics'],
  '[
    {"url":"https://nordwind.example/home","label":"Home"},
    {"url":"https://nordwind.example/business","label":"Business banking"},
    {"url":"https://nordwind.example/savings","label":"Savings"}
  ]'::jsonb,
  array['Retail banking', 'SME', 'Private wealth'],
  '[
    {"hex":"#FFFFFF","role":"primary"},
    {"hex":"#1A1A1A","role":"accent"},
    {"hex":"#E8E4DC","role":"secondary"},
    {"hex":"#9CAF88","role":"highlight"},
    {"hex":"#C4B5D8","role":"highlight"}
  ]'::jsonb,
  true
);

insert into public.brand_profiles (
  id, tenant_id, version, visual_style, composition, moods, avoid, content_pages, segments, palette, is_active
) values (
  '55555555-5555-4555-8555-555555555555',
  '22222222-2222-4222-8222-222222222222',
  1,
  'Artisan specialty coffee: warm earth tones, tactile textures, craft storytelling, intimate café atmosphere.',
  'Close crops on product and hands; organic framing.',
  array['warm', 'authentic'],
  array['corporate sterility', 'cold blue grading'],
  '[
    {"url":"https://roastworks.example/shop","label":"Shop"},
    {"url":"https://roastworks.example/subscriptions","label":"Subscriptions"},
    {"url":"https://roastworks.example/wholesale","label":"Wholesale"}
  ]'::jsonb,
  array['Home brewers', 'Café partners', 'Gift buyers'],
  '[
    {"hex":"#FFFFFF","role":"primary"},
    {"hex":"#2C1810","role":"accent"},
    {"hex":"#F5E6C8","role":"secondary"},
    {"hex":"#6B7F5E","role":"highlight"},
    {"hex":"#B8A9C9","role":"highlight"}
  ]'::jsonb,
  true
);

insert into public.brand_assets (id, tenant_id, kind, storage_path, mime_type, description) values
  (
    '66666666-6666-4666-8666-666666666666',
    '11111111-1111-4111-8111-111111111111',
    'style_reference',
    '11111111-1111-4111-8111-111111111111/nordwind-ref.png',
    'image/png',
    'Cool minimal interior reference'
  ),
  (
    '77777777-7777-4777-8777-777777777777',
    '22222222-2222-4222-8222-222222222222',
    'style_reference',
    '22222222-2222-4222-8222-222222222222/roastworks-ref.png',
    'image/png',
    'Warm café product reference'
  );
