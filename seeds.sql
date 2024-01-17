-- admins: 1
INSERT INTO admins (id, fullname, username) VALUES
    (1, 'Admin Utama', 'admin');
-- assessors: 57
INSERT INTO assessors (id, fullname, username) VALUES
    (1, 'Bakiman Bakiono', 'bakiman'),
    (2, 'Wanda Jati', 'wanda'),
    (3, 'Bahuwirya Basupati', 'bahuwirya'),
    (4, 'Sasmaya Wasista', 'sasmaya'),
    (5, 'Buntaran Adiharja', 'buntaran'),
    (6, 'Tasmirah Asirwanda', 'tasmirah'),
    (7, 'Samita Wignya', 'samita'),
    (8, 'Gemana Sasmaka', 'gemana'),
    (9, 'Putri Luhung', 'putri'),
    (10, 'Asmuni Estu', 'asmuni'),
    (11, 'Jumadi Eluh', 'jumadi'),
    (12, 'Aslijan Luwar', 'aslijan'),
    (13, 'Balidin Elon', 'balidin'),
    (14, 'Surastri Puspita', 'surastri'),
    (15, 'Danu Kambali Gunanto', 'danu'),
    (16, 'Karsa Dimaz', 'karsa'),
    (17, 'Budi Candrawimba', 'budi'),
    (18, 'Caket Rina', 'caket'),
    (19, 'Hardana Jayadi Gandi', 'hardana'),
    (20, 'Branta Suci', 'branta'),
    (21, 'Ajimin Sujana', 'ajimin'),
    (22, 'Jabal Basunjaya', 'jabal'),
    (23, 'Bataria Panggih Suciatma', 'bataria'),
    (24, 'Yuwana Cakrabuana', 'yuwana'),
    (25, 'Galih Wyatt', 'galih'),
    (26, 'Shhh Pinda', 'shhh'),
    (27, 'Julian Lintang', 'julian'),
    (28, 'Kunthara Miles Raden', 'kunthara'),
    (29, 'Jonathan Lincoln', 'jonathan'),
    (30, 'Jace Patrick', 'jace'),
    (31, 'Cahyono Isabel', 'cahyono'),
    (32, 'Kamidin Edi Panca', 'kamidin'),
    (33, 'Kusuma Burnadi', 'kusuma'),
    (34, 'Adrian Asmadi', 'adrian'),
    (35, 'Respati Pradipta Widya', 'respati'),
    (36, 'Ambarwati Axel', 'ambarwati'),
    (37, 'Lucas Marlon Bima', 'lucas'),
    (38, 'Cira Harsana', 'cira'),
    (39, 'Josiah Giyono', 'josiah'),
    (40, 'Candrarupa Evan Arjanti', 'candrarupa'),
    (41, 'Arawinda Sambada Merel', 'arawinda'),
    (42, 'Bart Gandik', 'bart'),
    (43, 'Dartono Astutiningtyas', 'dartono'),
    (44, 'Wijaksana Wibisono Luluh', 'wijaksana'),
    (45, 'Gendis Henry', 'gendis'),
    (46, 'Loes Elias', 'loes'),
    (47, 'Windriya Titah', 'windriya'),
    (48, 'Ayu Gunari', 'ayu123'),
    (49, 'Tyas Batari Cahyo', 'tyas'),
    (50, 'Basiran Darmaji', 'basiran'),
    (51, 'Arisanti Thijs', 'arisanti'),
    (52, 'Jamie Wasundari Warti', 'jamie'),
    (53, 'Issac Martaka', 'issac'),
    (54, 'Tirah Santiago', 'tirah'),
    (55, 'Jouri Gamani', 'jouri'),
    (56, 'Grayson Laksmi', 'grayson'),
    (57, 'Darapuspita Kasti', 'darapuspita');
-- organizations: 3, starts from 11
INSERT INTO organizations (id, name) VALUES
    (11, 'PT Agung Brajak Cunthi'),
    (12, 'PT Dinoyo Environment Futures'),
    (13, 'PT Guthe Harmoni Indonesia');
-- tools: 9, with custom ids
INSERT INTO tools VALUES
    -- id, category, title, version
    ('SELF-01', 'self', 'GPQ', 'generic'),
    ('SELF-02', 'self', 'GPQ + G-MATE', 'generic'),
    ('SELF-03', 'self', 'GPQ + C-RATE', 'generic'),
    ('CASE-01', 'case', 'Case Analysis', 'generic'),
    ('CASE-02', 'case', 'Intray', 'generic'),
    ('F2F-01', 'f2f', 'Wawancara', 'generic'),
    ('F2F-02', 'f2f', 'Wawancara + Presentasi', 'generic'),
    ('F2F-03', 'f2f', 'Roleplay', 'generic'),
    ('GRP-01', 'lgd', 'LGD', 'generic');
-- slot dummy, delete later
INSERT INTO slots (id, modules, mode) VALUES (10, 1, 'SEED-SLOT');
-- actual slots
INSERT INTO slots (modules, mode, slot1, slot2, slot3, slot4) VALUES
    (4, 'ALL-TYPES', 'f2f', 'self', 'case', 'lgd'),
    (4, 'ALL-TYPES', 'self', 'case', 'lgd', 'f2f'),
    (4, 'ALL-TYPES', 'case', 'lgd', 'f2f', 'self'),
    (4, 'ALL-TYPES', 'lgd', 'f2f', 'self', 'case');
INSERT INTO slots (modules, mode, slot1, slot2, slot3, slot4) VALUES
    -- 3-no-self
    (3, 'NO-SELF', 'f2f', 'case', 'lgd', null),
    (3, 'NO-SELF', 'case', 'lgd', 'f2f', null),
    (3, 'NO-SELF', 'lgd', 'f2f', 'case', null),
    -- 3-no-group
    (3, 'NO-GROUP', 'f2f', 'self', 'case', null),
    (3, 'NO-GROUP', 'self', 'case', 'f2f', null),
    (3, 'NO-GROUP', 'case', 'f2f', 'self', null),
    -- 3-no-case
    (3, 'NO-CASE', 'f2f', 'self', 'lgd', null),
    (3, 'NO-CASE', 'self', 'lgd', 'f2f', null),
    (3, 'NO-CASE', 'lgd', 'f2f', 'self', null),
    -- 3-no-f2f
    (3, 'NO-F2F', 'self', 'case', 'lgd', null),
    (3, 'NO-F2F', 'case', 'lgd', 'self', null),
    (3, 'NO-F2F', 'lgd', 'self', 'case', null);
INSERT INTO slots (modules, mode, slot1, slot2, slot3, slot4) VALUES
    -- Tanpa asesor
    (2, 'SELF-CASE', 'self', 'case', null, null),
    (2, 'SELF-CASE', null, null, 'self', 'case'),
    --
    (2, 'SELF-GROUP', 'self', 'lgd', null, null),
    (2, 'SELF-GROUP', 'lgd', 'self', null, null),
    (2, 'SELF-GROUP', null, null, 'self', 'lgd'),
    (2, 'SELF-GROUP', null, null, 'lgd', 'self'),
    --
    (2, 'SELF-F2F', 'self', 'f2f', null, null),
    (2, 'SELF-F2F', 'f2f', 'self', null, null),
    (2, 'SELF-F2F', null, null, 'self', 'f2f'),
    (2, 'SELF-F2F', null, null, 'f2f', 'self'),
    --
    (2, 'CASE-GROUP', 'case', 'lgd', null, null),
    (2, 'CASE-GROUP', 'lgd', 'case', null, null),
    (2, 'CASE-GROUP', null, null, 'case', 'lgd'),
    (2, 'CASE-GROUP', null, null, 'lgd', 'case'),
    --
    (2, 'CASE-F2F', 'case', 'f2f', null, null),
    (2, 'CASE-F2F', 'f2f', 'case', null, null),
    (2, 'CASE-F2F', null, null, 'case', 'f2f'),
    (2, 'CASE-F2F', null, null, 'f2f', 'case'),
    --
    (2, 'GROUP-F2F', 'lgd', 'f2f', null, null),
    (2, 'GROUP-F2F', 'f2f', 'lgd', null, null),
    (2, 'GROUP-F2F', null, null, 'lgd', 'f2f'),
    (2, 'GROUP-F2F', null, null, 'f2f', 'lgd');
INSERT INTO slots (modules, mode, slot1, slot2, slot3, slot4) VALUES
    (1, 'SELF-ONLY', 'self', null, null, null),
    (1, 'SELF-ONLY', null, 'self', null, null),
    (1, 'SELF-ONLY', null, null, 'self', null),
    (1, 'SELF-ONLY', null, null, null, 'self'),
    --
    (1, 'CASE-ONLY', 'case', null, null, null),
    (1, 'CASE-ONLY', null, 'case', null, null),
    (1, 'CASE-ONLY', null, null, 'case', null),
    (1, 'CASE-ONLY', null, null, null, 'case'),
    --
    (1, 'F2F-ONLY', 'f2f', null, null, null),
    (1, 'F2F-ONLY', null, 'f2f', null, null),
    (1, 'F2F-ONLY', null, null, 'f2f', null),
    (1, 'F2F-ONLY', null, null, null, 'f2f'),
    --
    (1, 'GROUP-ONLY', 'lgd', null, null, null),
    (1, 'GROUP-ONLY', null, 'lgd', null, null),
    (1, 'GROUP-ONLY', null, null, 'lgd', null),
    (1, 'GROUP-ONLY', null, null, null, 'lgd');
DELETE FROM slots WHERE id=10;
-- UPDATE SLOTS
UPDATE slots SET self_pos=1 WHERE slot1='self';
UPDATE slots SET self_pos=2 WHERE slot2='self';
UPDATE slots SET self_pos=3 WHERE slot3='self';
UPDATE slots SET self_pos=4 WHERE slot4='self';
UPDATE slots SET case_pos=1 WHERE slot1='case';
UPDATE slots SET case_pos=2 WHERE slot2='case';
UPDATE slots SET case_pos=3 WHERE slot3='case';
UPDATE slots SET case_pos=4 WHERE slot4='case';
UPDATE slots SET f2f_pos=1 WHERE slot1='f2f';
UPDATE slots SET f2f_pos=2 WHERE slot2='f2f';
UPDATE slots SET f2f_pos=3 WHERE slot3='f2f';
UPDATE slots SET f2f_pos=4 WHERE slot4='f2f';
UPDATE slots SET lgd_pos=1 WHERE slot1='lgd';
UPDATE slots SET lgd_pos=2 WHERE slot2='lgd';
UPDATE slots SET lgd_pos=3 WHERE slot3='lgd';
UPDATE slots SET lgd_pos=4 WHERE slot4='lgd';
-- Batches, starts from 1101
INSERT INTO batches (id, org_id, date, name) VALUES
    (1101, 11, '2024-01-01', 'Batch'),
    (1102, 12, '2024-01-03', 'Batch'),
    (1103, 13, '2024-01-05', 'Batch'),
    (1104, 11, '2024-01-06', 'Batch');
