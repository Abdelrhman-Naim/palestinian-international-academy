/**
 * Checks whether a course belongs to a specific instructor in a language-agnostic manner.
 * 
 * Strategy:
 * 1. Checks immutable UID (instructorId, instructorUid, userId).
 * 2. If UID is not present on legacy records, matches across all name variations
 *    (Arabic name, English name, full name, display name, and raw originalData).
 * 
 * @param {Object} course - Course object (may be translated or raw)
 * @param {Object} currentUser - Firebase Auth user object
 * @param {Object} userData - Firestore user data object
 * @returns {boolean}
 */
export function isCourseOwnedByInstructor(course, currentUser, userData) {
  if (!course) return false;
  if (!currentUser && !userData) return false;

  const currentUid = currentUser?.uid || userData?.uid || userData?.id;

  // 1. Direct UID match (authoritative, 100% language-independent)
  const courseInstructorId =
    course.instructorId ||
    course.instructorUid ||
    course.userId ||
    course.originalData?.instructorId ||
    course.originalData?.instructorUid ||
    course.originalData?.userId;

  if (currentUid && courseInstructorId && String(courseInstructorId).trim() === String(currentUid).trim()) {
    return true;
  }

  // 2. Multilingual Name Matching (Fallback for legacy database documents without instructorId)
  const instructorNames = [
    userData?.name,
    userData?.fullName,
    userData?.displayName,
    userData?.name_en,
    userData?.fullName_en,
    currentUser?.displayName
  ]
    .filter(Boolean)
    .map(n => String(n).trim().toLowerCase());

  if (instructorNames.length === 0) return false;

  const courseInstructorNames = [
    course.instructor,
    course.instructor_en,
    course.instructorName,
    course.originalData?.instructor,
    course.originalData?.instructor_en,
    course.originalData?.instructorName
  ]
    .filter(Boolean)
    .map(n => String(n).trim().toLowerCase());

  return instructorNames.some(instName =>
    courseInstructorNames.some(
      cName => cName === instName || cName.includes(instName) || instName.includes(cName)
    )
  );
}
