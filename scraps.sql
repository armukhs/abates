DROP VIEW IF EXISTS v_organizations; CREATE VIEW v_organizations AS SELECT
    o.*,
    (SELECT COUNT(*) FROM batches WHERE org_id=o.id) batches,
    (SELECT COUNT(*) FROM persons WHERE org_id=o.id) heads,
    (SELECT min(date) FROM batches WHERE org_id=o.id) first_batch,
    (SELECT max(date) FROM batches WHERE org_id=o.id) last_batch,
		() prev_id,
		() next_id
    FROM organizations o;
select o.id,
(select id from organizations where id>o.id limit 1) next_id,
(select id from organizations where id<o.id order by id desc limit 1) prev_id
from organizations o;

-- ORG-BATCH-PERSON
-- 101-1001-

-- Select free assessors
	-- 1. select u
