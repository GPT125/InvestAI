import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, PlayCircle, Clock, BarChart3, GraduationCap, TrendingUp, Zap } from 'lucide-react';
import { COURSES, TOTAL_LESSONS } from '../data/academyCourses';
import { useAuth } from '../context/AuthContext';

/** Read per-user completed-lesson set from localStorage. */
function loadCompleted(userId) {
  try {
    const raw = localStorage.getItem(`investai-academy-${userId || 'guest'}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/** Normalize any level string to one of: Beginner / Intermediate / Advanced. */
function normalizeLevel(raw) {
  if (!raw) return 'Intermediate';
  const s = raw.toLowerCase();
  if (s.includes('advanced')) return 'Advanced';
  if (s.includes('intermediate')) return 'Intermediate';
  if (s.includes('beginner')) return 'Beginner';
  return 'Intermediate';
}

const LEVEL_META = {
  Beginner: {
    icon: GraduationCap,
    color: '#22c55e',
    title: 'Beginner',
    tagline: 'Start here. No prior knowledge needed — build your foundation.',
  },
  Intermediate: {
    icon: TrendingUp,
    color: '#f59e0b',
    title: 'Intermediate',
    tagline: 'You know the basics. Now learn to analyze, plan, and manage risk.',
  },
  Advanced: {
    icon: Zap,
    color: '#ef4444',
    title: 'Advanced',
    tagline: 'Deep, specialized topics for investors who want real mastery.',
  },
};

const LEVEL_ORDER = ['Beginner', 'Intermediate', 'Advanced'];

export default function Academy() {
  const { user } = useAuth();
  const completed = loadCompleted(user?.id);

  const totalDone = completed.size;
  const pct = Math.min(100, Math.round((totalDone / TOTAL_LESSONS) * 100));

  // Group courses by normalized level
  const grouped = { Beginner: [], Intermediate: [], Advanced: [] };
  for (const course of COURSES) {
    const lvl = normalizeLevel(course.level);
    grouped[lvl].push(course);
  }

  // Find the next unfinished lesson across all courses (in level order)
  let nextLesson = null;
  for (const lvl of LEVEL_ORDER) {
    for (const course of grouped[lvl]) {
      for (const l of course.lessons) {
        if (!completed.has(l.id)) {
          nextLesson = { course, lesson: l };
          break;
        }
      }
      if (nextLesson) break;
    }
    if (nextLesson) break;
  }

  // Compute per-level stats
  const levelStats = {};
  for (const lvl of LEVEL_ORDER) {
    const courses = grouped[lvl];
    const totalL = courses.reduce((s, c) => s + c.lessons.length, 0);
    const doneL = courses.reduce(
      (s, c) => s + c.lessons.filter(l => completed.has(l.id)).length,
      0
    );
    levelStats[lvl] = { totalL, doneL, pct: totalL ? Math.round((doneL / totalL) * 100) : 0 };
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>
            <BookOpen size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Investing Academy
          </h1>
          <span className="dashboard-date">
            {TOTAL_LESSONS} lessons · {COURSES.length} courses · From complete beginner to advanced investor
          </span>
        </div>
        {nextLesson && (
          <Link
            to={`/academy/${nextLesson.course.id}/${nextLesson.lesson.id}`}
            className="analyze-btn"
            style={{ textDecoration: 'none' }}
          >
            <PlayCircle size={16} /> {totalDone === 0 ? 'Start Learning' : 'Continue Learning'}
          </Link>
        )}
      </div>

      {/* Overall progress */}
      <div className="academy-progress-card">
        <div className="academy-progress-header">
          <div>
            <div className="academy-progress-label">Your overall progress</div>
            <div className="academy-progress-count">
              {totalDone} / {TOTAL_LESSONS} lessons completed
            </div>
          </div>
          <div className="academy-progress-pct">{pct}%</div>
        </div>
        <div className="academy-progress-bar">
          <div className="academy-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Level-by-level sections */}
      {LEVEL_ORDER.map((lvl) => {
        const courses = grouped[lvl];
        if (!courses.length) return null;
        const meta = LEVEL_META[lvl];
        const Icon = meta.icon;
        const stats = levelStats[lvl];

        return (
          <section key={lvl} className="academy-level-section">
            <div className="academy-level-header">
              <div className="academy-level-title-row">
                <span className="academy-level-icon" style={{ background: meta.color + '22', color: meta.color }}>
                  <Icon size={20} />
                </span>
                <div>
                  <h2 className="academy-level-title" style={{ color: meta.color }}>{meta.title}</h2>
                  <div className="academy-level-tagline">{meta.tagline}</div>
                </div>
              </div>
              <div className="academy-level-stats">
                <span>{courses.length} {courses.length === 1 ? 'course' : 'courses'}</span>
                <span>·</span>
                <span>
                  {stats.doneL}/{stats.totalL} lessons
                </span>
                <span>·</span>
                <span style={{ color: meta.color, fontWeight: 600 }}>{stats.pct}%</span>
              </div>
            </div>
            <div className="academy-level-bar">
              <div
                className="academy-level-bar-fill"
                style={{ width: `${stats.pct}%`, background: meta.color }}
              />
            </div>

            <div className="academy-courses-grid">
              {courses.map((course) => {
                const done = course.lessons.filter(l => completed.has(l.id)).length;
                const coursePct = Math.round((done / course.lessons.length) * 100);
                const isComplete = done === course.lessons.length;
                return (
                  <Link
                    to={`/academy/${course.id}`}
                    key={course.id}
                    className="academy-course-card"
                  >
                    <div className="academy-course-header">
                      <span
                        className="academy-course-icon"
                        style={{ background: course.color + '22', color: course.color }}
                      >
                        {course.icon}
                      </span>
                      <span
                        className="academy-course-level"
                        style={{ color: meta.color }}
                      >
                        <BarChart3 size={11} /> {meta.title}
                      </span>
                    </div>
                    <h3 className="academy-course-title">
                      {course.title}
                      {isComplete && (
                        <CheckCircle2
                          size={16}
                          style={{ marginLeft: 6, color: '#22c55e' }}
                        />
                      )}
                    </h3>
                    <p className="academy-course-tagline">{course.tagline}</p>
                    <div className="academy-course-meta">
                      <span>
                        <Clock size={12} /> {course.duration}
                      </span>
                      <span>{course.lessons.length} lessons</span>
                      <span>
                        {done} / {course.lessons.length} done
                      </span>
                    </div>
                    <div className="academy-mini-bar">
                      <div
                        className="academy-mini-fill"
                        style={{ width: `${coursePct}%`, background: course.color }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
