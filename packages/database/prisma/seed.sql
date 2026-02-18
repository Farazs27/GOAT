-- Cleanup new models
DELETE FROM staff_chat_messages;
DELETE FROM staff_chat_members;
DELETE FROM staff_chats;
DELETE FROM note_flags;

-- Seed NZa Codes 2026
INSERT INTO nza_codes (id, code, category, description_nl, max_tariff, unit, requires_tooth, requires_surface, valid_from, valid_until, is_active) VALUES
(gen_random_uuid(), 'C01', 'CONSULTATIE', 'Eerste consult mondzorg', 25.72, 'per_consult', false, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'C02', 'CONSULTATIE', 'Periodiek mondonderzoek', 25.72, 'per_consult', false, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'C03', 'CONSULTATIE', 'Consult met uitgebreid onderzoek', 51.44, 'per_consult', false, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'X01', 'RONTGEN', 'Bitewing opname (1-2)', 20.58, 'per_image', false, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'X02', 'RONTGEN', 'Bitewing opname (3-4)', 30.87, 'per_image', false, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'X10', 'RONTGEN', 'Panoramische opname', 46.29, 'per_image', false, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'V21', 'VULLING', 'Composiet 1 vlak', 64.30, 'per_surface', true, true, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'V22', 'VULLING', 'Composiet 2 vlakken', 89.00, 'per_surface', true, true, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'E01', 'ENDO', 'Pulpa-extirpatie', 77.16, 'per_tooth', true, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'E02', 'ENDO', 'Wortelkanaalbehandeling 1 kanaal', 128.60, 'per_tooth', true, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'M01', 'PREVENTIE', 'Tandsteen verwijderen', 18.00, 'per_5min', false, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'M05', 'PREVENTIE', 'Fluoride applicatie', 25.72, 'per_treatment', false, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'A01', 'VERDOVING', 'Lokale verdoving', 15.43, 'per_injection', false, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'X30', 'EXTRACTIE', 'Extractie eenvoudig', 51.44, 'per_tooth', true, false, '2026-01-01', '2026-12-31', true),
(gen_random_uuid(), 'R01', 'KROON', 'Volledige kroon metaal', 360.08, 'per_tooth', true, false, '2026-01-01', '2026-12-31', true)
ON CONFLICT (code, valid_from) DO NOTHING;

-- Create test practice
INSERT INTO practices (id, name, slug, agb_code, kvk_number, address_street, address_city, address_postal, phone, email, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), 'Tandartspraktijk Amsterdam', 'tandarts-praktijk-amsterdam', '12345678', '12345678', 'Kalverstraat 123', 'Amsterdam', '1012 NX', '+31 20 123 4567', 'info@tandarts-amsterdam.nl', true, now(), now())
ON CONFLICT (slug) DO NOTHING;

-- Create test users using explicit UUIDs
WITH practice AS (SELECT id FROM practices WHERE slug = 'tandarts-praktijk-amsterdam')
INSERT INTO users (id, practice_id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
SELECT gen_random_uuid(), practice.id, 'admin@nexiom.nl', '$2b$10$YourHashedPasswordHere', 'Admin', 'User', 'PRACTICE_ADMIN', true, now(), now()
FROM practice
ON CONFLICT (email) DO NOTHING;

WITH practice AS (SELECT id FROM practices WHERE slug = 'tandarts-praktijk-amsterdam')
INSERT INTO users (id, practice_id, email, password_hash, first_name, last_name, role, big_number, is_active, created_at, updated_at)
SELECT gen_random_uuid(), practice.id, 'dentist@tandarts-amsterdam.nl', '$2b$10$YourHashedPasswordHere', 'Jan', 'de Vries', 'DENTIST', '12345678901', true, now(), now()
FROM practice
ON CONFLICT (email) DO NOTHING;

-- Create test patient
WITH practice AS (SELECT id FROM practices WHERE slug = 'tandarts-praktijk-amsterdam')
INSERT INTO patients (id, practice_id, patient_number, first_name, last_name, date_of_birth, email, phone, bsn, insurance_company, insurance_number, gdpr_consent_at, is_active, created_at, updated_at)
SELECT gen_random_uuid(), practice.id, 'P-2026-0001', 'Peter', 'Jansen', '1985-06-15', 'peter.jansen@email.nl', '+31 6 12345678', '123456782', 'VGZ', '123456789', now(), true, now(), now()
FROM practice
ON CONFLICT (practice_id, patient_number) DO NOTHING;
