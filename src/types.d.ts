type Env = {
  __STATIC_CONTENT: KVNamespace;
  API_KEY: string;
  DB: D1Database;
  COOKIE_NAME: string;
  COOKIE_PASSWORD: string;
  CUSTOM_HEADER: string;
  COGNITIVE_KEYS: string;
}
type Admin = {
  id: number;
  fullname: string;
  username: string;
  email: string|null;
}
type Assessor = {
  id: number;
  fullname: string;
  username: string;
  email: string|null;
}
type BatchAssessor = {
	batch_id: number;
	ass_id: number;
	type: string;
	slot1: number;
	slot2: number;
	slot3: number;
	slot4: number;
}
type VBatchAssessor = BatchAssessor & {
	fullname: string;
	username: string;
	email: string|null;
}
// Org
type Organization = {
  id: number;
  name: string;
  address: string|null;
}
type VOrganization = Organization & {
  batches: number;
  heads: number;
  first_batch: string|null;
  last_batch: string|null;
}
type Tools = {
  id: string;
  category: string;
  title: string;
  version: string;
}
type Slot = {
  id: string;
  modules: number;
  mode: string;
  slot1: string|null;
  slot2: string|null;
  slot3: string|null;
  slot4: string|null;
  pself: number;
  pcase: number;
  pf2f: number;
  plgd: number;
}
// Batch
type Batch = {
  id: number;
  org_id: number;
  name: string;
  date: string;
  mode: string|null;
  split: number;
  on_self: string|null;
  on_case: string|null;
  on_f2f: string|null;
  on_lgd: string|null;
  time1: string|null;
  time2: string|null;
  time3: string|null;
  time4: string|null;
}
type VBatch = Batch & {
  org_name: string;
  modules: number|null;
  mod_self: string|null;  // module's title
  mod_case: string|null;  // module's title
  mod_f2f: string|null;   // module's title
  mod_lgd: string|null; // module's title
  permutation: number;
  group_type: string;
  need_assessors: number; // 0 1 as boolean
  persons: number;
  groups:number;
}
// Group
type Group = {
  id: string;
  batch_id: number;
  name: string;
  slot_id: string;
  lgd_ass_id: number|null;
}
type VGroup = Group & {
  lgd_assessor_name: string|null;
  members: number;
  slot1: string|null;
  slot2: string|null;
  slot3: string|null;
  slot4: string|null;
  self_pos: number;
  case_pos: number;
  f2f_pos: number;
  lgd_pos: number;
}
type Grouping = {
  batch_id: number;
  group_id: string;
  person_id: string;
  f2f_ass_id: string|null;
  case_ass_id: string|null;
}
// Person
type Person = {
  id: string;
  org_id: number;
  batch_id: number;
  fullname: string;
  username: string;
  email: string|null;
}
type VPerson = Person & {
  org_name: string;
  group_id: string;
  group_name: string;
  lgd_ass_id: number|null;
  lgd_assessor_name: string|null;
  f2f_ass_id: number|null;
  f2f_assessor_name: string|null;
  case_ass_id: number|null;
  case_assessor_name: string|null;
  slot_id: number;
  slot1: string|null;
  slot2: string|null;
  slot3: string|null;
  slot4: string|null;
	self_pos: number,
	case_pos: number,
	f2f_pos: number,
	lgd_pos: number,
}
type SlotsAlloc = { // SlotsAlloc
  batch_id: number;
  lgd_slot1: number;
  lgd_slot2: number;
  lgd_slot3: number;
  lgd_slot4: number;
  f2f_slot1: number;
  f2f_slot2: number;
  f2f_slot3: number;
  f2f_slot4: number;
  f2f_slot1_size: number;
  f2f_slot2_size: number;
  f2f_slot3_size: number;
  f2f_slot4_size: number;
}
type AssessorMinMax = {
	minlgd: number;
	minf2f: number;
	maxlgd: number;
	maxf2f: number;
}
//
type ModulesFormBody = {
  id: string;
  date: string;
  mode: string;
  onSelf: string;
  onCase: string;
  onF2f: string;
  onGroup: string;
  split: string;
};
//
type GroupWithMembers = {
  name: string;
  members: VPerson[];
  startBy: number;
}
type Minmax = {
	minlgd: number;
	maxlgd: number;
	minf2f: number;
	maxf2f: number;
}
