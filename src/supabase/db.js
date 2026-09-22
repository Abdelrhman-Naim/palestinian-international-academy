import { supabase } from './client';

// Map legacy table names to Supabase tables
const mapTableName = (table) => {
  if (table === 'users') return 'profiles';
  if (table === 'submissions') return 'submitted_assignments';
  return table;
};

const mapFieldToColumn = (table, field) => {
  if (field === 'courseId') return 'course_id';
  if (field === 'instructorId') return 'instructor_id';
  if (field === 'studentId' || field === 'uid') return 'student_id';
  if (field === 'assignmentId') return 'assignment_id';
  if (field === 'createdAt') return 'created_at';
  if (field === 'dueDate') return 'due_date';
  if (field === 'rawDueDate') return 'raw_due_date';
  if (field === 'imageName') return 'image_name';
  if (field === 'fileUrl') return 'file_url';
  if (field === 'fullName') return 'full_name';
  if (field === 'isApproved') return 'is_approved';
  if (field === 'pdfUrl' || field === 'link') return 'pdf_url';
  if (field === 'coverUrl') return 'cover_url';
  if (field === 'downloads' || field === 'downloadsCount') return 'downloads_count';
  if (field === 'categoryName' || (table === 'books' && field === 'category')) return 'category_name';
  if (field === 'categoryId') return 'category_id';
  if (field === 'completedLessons') return 'completed_lessons';
  if (field === 'courseTitle') return 'course_title';
  if (field === 'studentName') return 'student_name';
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
    uid: d.student_id || d.uid || d.id,
    role: d.role || 'student',
    status: status,
    is_approved: isApproved,
    name: d.name || d.full_name || d.student_name || d.email,
    fullName: d.full_name || d.name || d.student_name || d.email,
    courseId: d.course_id || d.courseId,
    course_id: d.course_id || d.courseId,
    courseTitle: d.course_title || d.courseTitle,
    instructorId: d.instructor_id || d.instructorId,
    studentId: d.student_id || d.studentId || d.uid,
    assignmentId: d.assignment_id || d.assignmentId,
    dueDate: d.due_date || d.dueDate || d.date,
    date: d.due_date || d.date || d.dueDate,
    createdAt: d.created_at || d.createdAt,
    submittedAt: d.submitted_at || d.submittedAt,
    fileUrl: d.file_url || d.fileUrl || d.fileName,
    file_url: d.file_url || d.fileUrl,
    imageName: d.image_name || d.imageName,
    image_name: d.image_name || d.imageName,
    studentName: d.student_name || d.studentName || d.student,
    student: d.student_name || d.student || d.studentName,
    assignment: d.assignment_title || d.assignment || d.title,
    content: d.notes || d.content,
    submissions: d.submissions !== undefined ? d.submissions : 0,
    progress: d.details?.progress || d.progress || 0,
    completedLessons: d.completed_lessons || d.details?.completedLessons || d.completedLessons || [],
    completed_lessons: d.completed_lessons || d.details?.completedLessons || d.completedLessons || [],
    downloads: d.downloads_count !== undefined ? d.downloads_count : (d.downloads || 0),
    downloads_count: d.downloads_count !== undefined ? d.downloads_count : (d.downloads || 0),
    pdf_url: d.pdf_url || d.file_url || d.link || '',
    link: d.pdf_url || d.file_url || d.link || '',
    cover_url: d.cover_url || d.coverUrl || '',
    coverUrl: d.cover_url || d.coverUrl || '',
    pages: Number(d.pages) || 120,
    rating: Number(d.rating) || 5.0,
    instructor: d.instructor || d.instructor_name || d.instructorName || d.instructor_en || '',
    instructor_name: d.instructor_name || d.instructor || d.instructorName || d.instructor_en || '',
    category: d.category || d.category_name || d.categoryName || '',
    category_name: d.category_name || d.category || d.categoryName || '',
    lectures: d.lectures || d.lessons || d.sessions || [],
    lessons: d.lessons || d.lectures || d.sessions || [],
    sessions: d.sessions || d.lectures || d.lessons || [],
    goals: d.goals || [],
    level: d.level || 'BEGINNER',
    lecturesCount: d.lecturesCount || d.lessons_count || (d.lectures || d.lessons || d.sessions || []).length || 1,
    lessons_count: d.lessons_count || d.lecturesCount || (d.lectures || d.lessons || d.sessions || []).length || 1,
  };
};

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
    if (id && typeof id === 'string' && id.includes('_')) {
      const parts = id.split('_');
      if (parts.length === 2) {
        const [studentId, courseId] = parts;
        const targetTable = (table === 'enrollments' || table === 'course_requests') ? table : table;
        let { data } = await supabase
          .from(targetTable)
          .select('*')
          .eq('student_id', studentId)
          .eq('course_id', courseId)
          .maybeSingle();

        if (!data && targetTable === 'enrollments') {
          const fallback = await supabase
            .from('course_requests')
            .select('*')
            .eq('student_id', studentId)
            .eq('course_id', courseId)
            .maybeSingle();
          data = fallback.data;
        }

        const mapped = mapDocData(data);
        return {
          exists: () => Boolean(data),
          data: () => mapped,
          id
        };
      }
    }

    const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    const mapped = mapDocData(data);
    return {
      exists: () => Boolean(data),
      data: () => mapped,
      id
    };
  } catch {
    return { exists: () => false, data: () => ({}), id };
  }
};

export const onSnapshot = (target, callback, errorCb) => {
  let isSubscribed = true;
  const isDoc = Boolean(target?._id);
  const fetcher = isDoc ? getDoc(target) : getDocs(target);

  fetcher.then(res => {
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
    const record = {};
    for (const [k, v] of Object.entries(data || {})) {
      if (v === undefined) continue;
      const col = mapFieldToColumn(table, k);
      record[col] = v;
    }

    if (id && !id.includes('_')) {
      record.id = id;
    }

    if ((table === 'course_requests' || table === 'enrollments') && id && id.includes('_')) {
      const [studentId, courseId] = id.split('_');
      record.student_id = studentId;
      record.course_id = courseId;
      if (!record.status) record.status = 'approved';
    }

    if (table === 'profiles' && record.name && !record.full_name) {
      record.full_name = record.name;
    }

    delete record.courseId;
    delete record.studentId;
    delete record.instructorId;
    delete record.dueDate;
    delete record.rawDueDate;
    delete record.enrolledAt;
    delete record.uid;

    if (table === 'enrollments') {
      const enrollRecord = {
        student_id: record.student_id,
        course_id: record.course_id,
        course_title: record.course_title || record.courseTitle || '',
        progress: record.progress || record.details?.progress || 0,
        completed_lessons: record.completed_lessons || record.completedLessons || record.details?.completedLessons || []
      };

      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', enrollRecord.student_id)
        .eq('course_id', enrollRecord.course_id)
        .maybeSingle();

      if (existing) {
        await supabase.from('enrollments').update(enrollRecord).eq('id', existing.id);
      } else {
        await supabase.from('enrollments').insert([enrollRecord]);
      }

      // Also ensure course_requests has an approved record
      const reqRecord = {
        student_id: record.student_id,
        course_id: record.course_id,
        course_title: record.course_title || record.courseTitle || '',
        student_name: record.student_name || record.studentName || '',
        student_email: record.student_email || record.studentEmail || '',
        status: 'approved'
      };
      const { data: existingReq } = await supabase
        .from('course_requests')
        .select('id')
        .eq('student_id', reqRecord.student_id)
        .eq('course_id', reqRecord.course_id)
        .maybeSingle();

      if (existingReq) {
        await supabase.from('course_requests').update(reqRecord).eq('id', existingReq.id);
      } else {
        await supabase.from('course_requests').insert([reqRecord]);
      }
      return { ok: true };
    }

    if (table === 'course_requests') {
      const { data: existing } = await supabase
        .from('course_requests')
        .select('id')
        .eq('student_id', record.student_id)
        .eq('course_id', record.course_id)
        .maybeSingle();

      if (existing) {
        await supabase.from('course_requests').update(record).eq('id', existing.id);
      } else {
        await supabase.from('course_requests').insert([record]);
      }
      return { ok: true };
    }

    const { error } = await supabase.from(table).upsert(record);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return { ok: true };
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
    if (table === 'courses') {
      if (record.instructor && !record.instructor_name) record.instructor_name = record.instructor;
      if (record.instructor_name && !record.instructor) record.instructor = record.instructor_name;
      if (record.category && !record.category_name) record.category_name = record.category;
      if (record.category_name && !record.category) record.category = record.category_name;
      const sess = record.sessions || record.lectures || record.lessons;
      if (sess && Array.isArray(sess)) {
        const norm = sess.map((s, idx) => ({
          number: s.number || idx + 1,
          title: s.title || s.name || '',
          link: s.link || s.url || s.videoUrl || s.video_url || ''
        }));
        record.lessons = norm;
        record.lectures = norm;
        record.sessions = norm;
        record.lessons_count = norm.length;
      }
      delete record.avatar;
      delete record.instructorId;
      delete record.lecturesCount;
      delete record.imageName;
    }

    for (let attempt = 0; attempt < 8; attempt++) {
      const { error } = await supabase.from(table).update(record).eq('id', id);
      if (!error) return { ok: true };
      const match = error.message?.match(/Could not find the '([^']+)' column/i);
      if (match && match[1]) {
        delete record[match[1]];
        continue;
      }
      throw error;
    }
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
    if (table === 'books') {
      if (raw.title !== undefined) record.title = raw.title;
      if (raw.description !== undefined) record.description = raw.description || raw.title;
      if (raw.author !== undefined) record.author = raw.author;
      record.category_name = raw.category_name || raw.category || '';
      if (raw.category_id) record.category_id = raw.category_id;
      record.pdf_url = raw.pdf_url || raw.link || raw.file_url || '';
      record.cover_url = raw.cover_url || raw.coverUrl || '';
      record.pages = parseInt(raw.pages, 10) || 120;
      record.downloads_count = parseInt(raw.downloads_count ?? raw.downloads, 10) || 0;
      record.rating = Number(raw.rating) || 5.0;
      record.created_at = raw.created_at || new Date().toISOString();
    } else if (table === 'categories') {
      record.name = raw.name || raw.title || '';
      record.description = raw.description || '';
      record.created_at = raw.created_at || new Date().toISOString();
    } else {
      if (raw.title !== undefined) record.title = raw.title;
      if (raw.description !== undefined) record.description = raw.description;

      const courseId = raw.course_id || raw.courseId;
      if (courseId) record.course_id = courseId;

      const studentId = raw.student_id || raw.studentId;
      if (studentId) record.student_id = studentId;

      const assignmentId = raw.assignment_id || raw.assignmentId;
      if (assignmentId) record.assignment_id = assignmentId;

      const studentName = raw.student_name || raw.studentName || raw.student;
      if (studentName) record.student_name = studentName;

      const fileUrl = raw.file_url || raw.fileUrl;
      if (fileUrl) record.file_url = fileUrl;

      const notes = raw.notes || raw.content;
      if (notes) record.notes = notes;

      const createdAt = raw.created_at || raw.createdAt;
      record.created_at = createdAt || new Date().toISOString();
    }

    const rawDate = raw.raw_due_date || raw.rawDueDate || raw.dueDate || raw.due_date;
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        record.due_date = parsedDate.toISOString();
      }
    }

    if (table !== 'assignments' && raw.submissions !== undefined) {
      record.submissions = raw.submissions;
    }

    const { data: res, error } = await supabase.from(table).insert(record).select('id').single();
    if (error) {
      console.warn(`[Supabase Bridge] addDoc insert error on ${table}, attempting fallback:`, error.message);
      const fallbackRecord = { ...record };
      delete fallbackRecord.due_date;
      delete fallbackRecord.submissions;
      const retryRes = await supabase.from(table).insert(fallbackRecord).select('id').single();
      if (retryRes.error) {
        console.warn(`[Supabase Bridge] addDoc retry error on ${table}:`, retryRes.error.message);
        return { id: `doc_${Date.now()}` };
      }
      return { id: retryRes.data?.id || 'new-id' };
    }
    return { id: res?.id || 'new-id' };
  } catch (e) {
    console.warn(`[Supabase Bridge] addDoc error on table ${table}:`, e);
    return { id: `doc_${Date.now()}` };
  }
};

export default { db, auth, storage };
