import { supabase } from '../supabase/client';

// Map legacy table names to Supabase tables
const mapTableName = (table) => {
  if (table === 'users') return 'profiles';
  if (table === 'submissions') return 'submitted_assignments';
  return table;
};

const mapFieldToColumn = (table, field) => {
  if (field === 'courseId') return 'course_id';
  if (field === 'instructorId') return 'instructor_id';
  if (field === 'studentId') return 'student_id';
  if (field === 'assignmentId') return 'assignment_id';
  if (field === 'createdAt') return 'created_at';
  if (field === 'dueDate') return 'due_date';
  if (field === 'rawDueDate') return 'raw_due_date';
  if (field === 'imageName') return 'image_name';
  if (field === 'fileUrl') return 'file_url';
  if (field === 'fullName') return 'full_name';
  if (field === 'isApproved') return 'is_approved';
  return field;
};

const mapDocData = (d) => {
  if (!d) return {};
  const isInstructor = d.role === 'instructor';
  const isApproved = isInstructor ? (d.is_approved === true && d.status !== 'pending') : true;
  const status = isInstructor ? (isApproved ? 'active' : 'pending') : (d.status || 'active');

  return {
    ...d,
    id: d.id,
    uid: d.id,
    role: d.role || 'student',
    status: status,
    is_approved: isApproved,
    name: d.name || d.full_name || d.email,
    fullName: d.full_name || d.name || d.email,
    courseId: d.course_id || d.courseId,
    course_id: d.course_id || d.courseId,
    instructorId: d.instructor_id || d.instructorId,
    studentId: d.student_id || d.studentId,
    assignmentId: d.assignment_id || d.assignmentId,
    dueDate: d.due_date || d.dueDate || d.date,
    date: d.due_date || d.date || d.dueDate,
    createdAt: d.created_at || d.createdAt,
    submittedAt: d.submitted_at || d.submittedAt,
    fileUrl: d.file_url || d.fileUrl || d.fileName,
    studentName: d.student_name || d.studentName || d.student,
    student: d.student_name || d.student || d.studentName,
    assignment: d.assignment_title || d.assignment || d.title,
    content: d.notes || d.content,
  };
};

// Supabase compatibility bridge for legacy Firebase references
export const db = {
  collection: (name) => ({ _table: mapTableName(name) }),
  doc: (col, id) => ({ _table: mapTableName(col), _id: id }),
};

export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ? { uid: session.user.id, email: session.user.email, ...session.user } : null);
    });
    return subscription?.unsubscribe || (() => {});
  }
};

export const storage = {
  ref: (path) => path
};

export const collection = (dbObj, tableName) => {
  const table = typeof dbObj === 'string' ? dbObj : tableName;
  return { _table: mapTableName(table || 'courses') };
};

export const doc = (dbObj, tableName, id) => {
  if (typeof dbObj === 'string' && tableName) {
    return { _table: mapTableName(dbObj), _id: tableName };
  }
  if (dbObj && dbObj._table) {
    return { _table: mapTableName(dbObj._table), _id: tableName };
  }
  return { _table: mapTableName(tableName || 'courses'), _id: id };
};

export const query = (target, ...clauses) => {
  const table = mapTableName(target?._table || 'courses');
  const filters = (clauses || []).filter(c => c && c.type === 'where');
  return { _table: table, filters };
};

export const where = (field, op, value) => ({ type: 'where', field, op, value });
export const orderBy = (field, direction) => ({ type: 'orderBy', field, direction });
export const limit = (count) => ({ type: 'limit', count });
export const serverTimestamp = () => new Date().toISOString();
export const increment = (n) => n;
export const arrayUnion = (...items) => items;
export const arrayRemove = (...items) => items;

export const getDocs = async (target) => {
  const rawTable = target?._table || 'courses';
  const table = mapTableName(rawTable);
  try {
    let q = supabase.from(table).select('*');
    let data;
    let error;

    if (target?.filters && target.filters.length > 0) {
      target.filters.forEach(f => {
        const colName = mapFieldToColumn(table, f.field);
        if (f.op === '==') q = q.eq(colName, f.value);
        if (f.op === '!=') q = q.neq(colName, f.value);
        if (f.op === 'in') q = q.in(colName, f.value);
      });
      const res = await q;
      data = res.data;
      error = res.error;

      // Fallback if PostgREST query with filters fails (e.g. status=eq.pending HTTP 400 when column isn't in DB yet)
      if (error) {
        console.warn(`[Supabase Bridge] Filtering on table ${table} failed, falling back to client-side filtering:`, error.message);
        const fallbackRes = await supabase.from(table).select('*');
        if (!fallbackRes.error && fallbackRes.data) {
          error = null;
          data = fallbackRes.data.filter(item => {
            const mapped = mapDocData(item);
            return target.filters.every(f => {
              const val = mapped[f.field] ?? mapped[mapFieldToColumn(table, f.field)];
              if (f.op === '==') return val === f.value;
              if (f.op === '!=') return val !== f.value;
              if (f.op === 'in') return Array.isArray(f.value) && f.value.includes(val);
              return true;
            });
          });
        }
      }
    } else {
      const res = await q;
      data = res.data;
      error = res.error;
    }

    if (error) throw error;

    const docs = (data || []).map(d => {
      const mapped = mapDocData(d);
      return {
        id: mapped.id,
        data: () => mapped,
        exists: () => true
      };
    });

    return {
      size: docs.length,
      empty: docs.length === 0,
      docs
    };
  } catch (e) {
    console.warn(`[Supabase Bridge] getDocs error on table ${table}:`, e);
    return { size: 0, empty: true, docs: [] };
  }
};

export const getDoc = async (target) => {
  const rawTable = target?._table || 'courses';
  const table = mapTableName(rawTable);
  const id = target?._id;
  try {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    const mapped = mapDocData(data);
    return {
      exists: () => Boolean(data),
      data: () => mapped,
      id
    };
  } catch (e) {
    console.warn(`[Supabase Bridge] getDoc error on table ${table}/${id}:`, e);
    return { exists: () => false, data: () => ({}), id };
  }
};

export const onSnapshot = (target, callback, errorCb) => {
  let isSubscribed = true;
  getDocs(target).then(res => {
    if (isSubscribed && typeof callback === 'function') {
      callback(res);
    }
  }).catch(err => {
    if (isSubscribed && typeof errorCb === 'function') {
      errorCb(err);
    }
  });

  return () => {
    isSubscribed = false;
  };
};

export const setDoc = async (docRef, data) => {
  const rawTable = docRef?._table;
  const table = mapTableName(rawTable);
  const id = docRef?._id;
  if (!table) return { ok: false };
  try {
    const record = { ...data };
    if (id) record.id = id;
    if (table === 'profiles' && record.name && !record.full_name) {
      record.full_name = record.name;
    }
    const { error } = await supabase.from(table).upsert(record);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn(`[Supabase Bridge] setDoc error on table ${table}:`, e);
    return { ok: false, error: e };
  }
};

export const updateDoc = async (docRef, data) => {
  const rawTable = docRef?._table;
  const table = mapTableName(rawTable);
  const id = docRef?._id;
  if (!table || !id) return { ok: false };
  try {
    const record = { ...data };
    if (table === 'profiles') {
      if (record.name && !record.full_name) record.full_name = record.name;
      if (record.status === 'active') record.is_approved = true;
      if (record.status === 'rejected' || record.status === 'pending') record.is_approved = false;
      delete record.status;
    }
    if (record.courseId && !record.course_id) record.course_id = record.courseId;
    if (record.dueDate && !record.due_date) record.due_date = record.dueDate;
    if (record.studentId && !record.student_id) record.student_id = record.studentId;
    if (record.assignmentId && !record.assignment_id) record.assignment_id = record.assignmentId;

    const { error } = await supabase.from(table).update(record).eq('id', id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn(`[Supabase Bridge] updateDoc error on table ${table}/${id}:`, e);
    return { ok: false, error: e };
  }
};

export const deleteDoc = async (docRef) => {
  const rawTable = docRef?._table;
  const table = mapTableName(rawTable);
  const id = docRef?._id;
  if (!table || !id) return { ok: false };
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn(`[Supabase Bridge] deleteDoc error on table ${table}/${id}:`, e);
    return { ok: false, error: e };
  }
};

export const addDoc = async (colRef, data) => {
  const rawTable = colRef?._table;
  const table = mapTableName(rawTable);
  if (!table) return { id: 'error' };
  try {
    const record = { ...data };
    if (record.courseId && !record.course_id) record.course_id = record.courseId;
    if (record.dueDate && !record.due_date) record.due_date = record.dueDate;
    if (record.rawDueDate && !record.raw_due_date) record.raw_due_date = record.rawDueDate;
    if (record.imageName && !record.image_name) record.image_name = record.imageName;
    if (record.createdAt && !record.created_at) record.created_at = record.createdAt;
    if (record.studentId && !record.student_id) record.student_id = record.studentId;
    if (record.assignmentId && !record.assignment_id) record.assignment_id = record.assignmentId;
    if (record.studentName && !record.student_name) record.student_name = record.studentName;
    if (record.fileUrl && !record.file_url) record.file_url = record.fileUrl;

    const { data: res, error } = await supabase.from(table).insert(record).select('id').single();
    if (error) {
      console.warn(`[Supabase Bridge] addDoc insert error on ${table}, attempting clean fallback insert:`, error.message);
      const cleanRecord = {};
      if (record.course_id) cleanRecord.course_id = record.course_id;
      if (record.title) cleanRecord.title = record.title;
      if (record.description) cleanRecord.description = record.description;
      if (record.due_date) cleanRecord.due_date = record.due_date;
      if (record.student_id) cleanRecord.student_id = record.student_id;
      if (record.assignment_id) cleanRecord.assignment_id = record.assignment_id;
      if (record.student_name) cleanRecord.student_name = record.student_name;
      if (record.notes) cleanRecord.notes = record.notes;
      if (record.file_url) cleanRecord.file_url = record.file_url;
      if (record.created_at) cleanRecord.created_at = record.created_at;
      if (record.submissions !== undefined) cleanRecord.submissions = record.submissions;

      const retryRes = await supabase.from(table).insert(cleanRecord).select('id').single();
      if (retryRes.error) throw retryRes.error;
      return { id: retryRes.data?.id || 'new-id' };
    }
    return { id: res?.id || 'new-id' };
  } catch (e) {
    console.warn(`[Supabase Bridge] addDoc error on table ${table}:`, e);
    return { id: 'error' };
  }
};

export default { db, auth, storage };
