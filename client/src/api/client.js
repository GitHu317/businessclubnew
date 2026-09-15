// Centralized API client with JWT handling.
const PROD_BACKEND_URL = 'https://business-club-api-yk1k.onrender.com';
const BASE = import.meta.env.PROD ? `${PROD_BACKEND_URL}/api` : '/api';

function getToken() {
  return localStorage.getItem('bc_token');
}

async function request(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export const api = {
  // auth
  signup: (body) => request('/auth/signup', { method: 'POST', body, auth: false }),
  login: (body) => request('/auth/login', { method: 'POST', body, auth: false }),
  googleAuth: (idToken) => request('/auth/google', { method: 'POST', body: { idToken }, auth: false }),
  me: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body }),
  onboarding: (body) => request('/auth/onboarding', { method: 'PUT', body }),

  // dashboard
  dashboard: () => request('/dashboard'),
  updateMembership: (body) => request('/dashboard/membership-status', { method: 'PUT', body }),
  updateMembershipPayments: (body) => request('/dashboard/membership-payments', { method: 'PUT', body }),
  adminUsers: () => request('/dashboard/admin/users'),
  adminUserDetails: (id) => request(`/dashboard/admin/users/${id}/details`),
  deleteAdminUser: (id) => request(`/dashboard/admin/users/${id}`, { method: 'DELETE' }),

  // board members
  listBoardMembers: () => request('/board-members', { auth: false }),
  createBoardMember: (body) => request('/board-members', { method: 'POST', body }),
  updateBoardMember: (id, body) => request(`/board-members/${id}`, { method: 'PUT', body }),
  deleteBoardMember: (id) => request(`/board-members/${id}`, { method: 'DELETE' }),

  // courses
  listCourses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/courses${qs ? `?${qs}` : ''}`, { auth: false });
  },
  listCourseTags: () => request('/courses/tags/all', { auth: false }),
  getCourse: (slug) => request(`/courses/${slug}`, { auth: false }),
  enrollmentStatus: (slug) => request(`/courses/${slug}/enrollment-status`),
  createCourse: (body) => request('/courses', { method: 'POST', body }),
  updateCourse: (id, body) => request(`/courses/${id}`, { method: 'PUT', body }),
  deleteCourse: (id) => request(`/courses/${id}`, { method: 'DELETE' }),
  createLesson: (courseId, body) => request(`/courses/${courseId}/lessons`, { method: 'POST', body }),
  updateLesson: (courseId, id, body) => request(`/courses/${courseId}/lessons/${id}`, { method: 'PUT', body }),
  deleteLesson: (courseId, id) => request(`/courses/${courseId}/lessons/${id}`, { method: 'DELETE' }),
  reorderLessons: (courseId, orderedIds) => request(`/courses/${courseId}/lessons/reorder`, { method: 'POST', body: { orderedIds } }),
  enroll: (slug) => request(`/courses/${slug}/enroll`, { method: 'POST' }),
  completeLesson: (slug, lessonId) => request(`/courses/${slug}/lessons/${lessonId}/complete`, { method: 'POST' }),

  // course reviews
  listReviews: (slug) => request(`/courses/${slug}/reviews`, { auth: false }),
  submitReview: (slug, body) => request(`/courses/${slug}/reviews`, { method: 'POST', body }),

  // exams
  getExam: (id) => request(`/exams/${id}`),
  createExam: (body) => request('/exams', { method: 'POST', body }),
  updateExam: (id, body) => request(`/exams/${id}`, { method: 'PUT', body }),
  deleteExam: (id) => request(`/exams/${id}`, { method: 'DELETE' }),
  submitExam: (id, answers) => request(`/exams/${id}/submit`, { method: 'POST', body: { answers } }),
  myAttempts: () => request('/exams/my-attempts/all'),
  pendingGrades: () => request('/exams/pending-grades/all'),
  gradeAttempt: (attemptId, grades) => request(`/exams/grade/${attemptId}`, { method: 'POST', body: { grades } }),

  // certificates
  myCertificates: () => request('/certificates/mine'),
  verifyCertificate: (id) => request(`/certificates/${id}`, { auth: false }),
  certificateOnline: (id) => request(`/certificates/${id}/online`),
  setCertificateType: (id, type) => request(`/certificates/${id}/type`, { method: 'POST', body: { type } }),
  certificatePdfUrl: (id) => `${BASE}/certificates/${id}/pdf`,

  // instructors / creator workflow
  applyInstructor: (body) => request('/instructors/apply', { method: 'POST', body }),
  myInstructorApplication: () => request('/instructors/my-application'),
  listApplications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/instructors/applications${qs ? `?${qs}` : ''}`);
  },
  reviewApplication: (id, body) => request(`/instructors/applications/${id}/review`, { method: 'POST', body }),
  updateCreatorProfile: (body) => request('/instructors/profile', { method: 'PUT', body }),
  getInstructor: (id) => request(`/instructors/${id}`, { auth: false }),
  listInstructors: () => request('/instructors'),
  revokeInstructor: (userId) => request(`/instructors/${userId}/revoke`, { method: 'PUT' }),
  deleteInstructor: (userId) => request(`/instructors/${userId}`, { method: 'DELETE' }),

  // reviews moderation
  allReviews: () => request('/reviews/all'),
  moderateReview: (id, published) => request(`/reviews/${id}/moderate`, { method: 'PUT', body: { published } }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),

  // gamification
  myGamification: () => request('/gamification/me'),
  listBadges: () => request('/gamification/badges', { auth: false }),
  listCollectibles: () => request('/gamification/collectibles', { auth: false }),

  // chat
  listChatMessages: (channel) => request(`/chat/${channel}`),
  sendChatMessage: (channel, body) => request(`/chat/${channel}`, { method: 'POST', body: { body } }),
  deleteChatMessage: (id) => request(`/chat/message/${id}`, { method: 'DELETE' }),

  // faq
  listFAQ: () => request('/faq', { auth: false }),
  createFAQ: (body) => request('/faq', { method: 'POST', body }),
  updateFAQ: (id, body) => request(`/faq/${id}`, { method: 'PUT', body }),
  deleteFAQ: (id) => request(`/faq/${id}`, { method: 'DELETE' }),

  // analytics
  analyticsOverview: () => request('/analytics/overview'),
  analyticsRegistrations: () => request('/analytics/registrations'),
  analyticsEnrollmentsByCourse: () => request('/analytics/enrollments-by-course'),
  registrationScreening: () => request('/analytics/registration-screening'),

  // games
  listGames: () => request('/games', { auth: false }),
  getGame: (id) => request(`/games/${id}`, { auth: false }),
  createGame: (body) => request('/games', { method: 'POST', body }),
  updateGame: (id, body) => request(`/games/${id}`, { method: 'PUT', body }),
  deleteGame: (id) => request(`/games/${id}`, { method: 'DELETE' }),
  registerGame: (id) => request(`/games/${id}/register`, { method: 'POST' }),
  gameRegistrations: (id) => request(`/games/${id}/registrations`),

  // announcements
  listAnnouncements: () => request('/announcements', { auth: false }),
  createAnnouncement: (body) => request('/announcements', { method: 'POST', body }),
  deleteAnnouncement: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),

  // activity logs (President only)
  activityLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/activity-logs${qs ? `?${qs}` : ''}`);
  },
  activityStats: () => request('/activity-logs/stats'),
  deleteActivityLogs: () => request('/activity-logs', { method: 'DELETE' }),
};
