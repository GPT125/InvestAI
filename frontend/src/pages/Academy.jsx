import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, PlayCircle, Clock } from 'lucide-react';
import { COURSE, TOTAL_LESSONS } from '../data/academyCourse';
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

export default function Academy() {
  const { user } = useAuth();
  const completed = loadCompleted(user?.id);

  const totalDone = Array.from(completed).filter(id => id.includes('l')).length;
  const pct = Math.min(100, Math.round((totalDone / TOTAL_LESSONS) * 100));

  // Find the next unfinished lesson across all modules (for Continue button)
  let nextLesson = null;
  for (const m of COURSE) {
    for (const l of m.lessons) {
      if (!completed.has(l.id)) { nextLesson = { mod: m, lesson: l }; break; }
    }
    if (nextLesson) break;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1><BookOpen size={26} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Investing Academy</h1>
          <span className="dashboard-date">Go from beginner to pro at your own pace · {TOTAL_LESSONS} lessons across {COURSE.length} modules</span>
        </div>
        {nextLesson && (
          <Link to={`/academy/${nextLesson.mod.id}/${nextLesson.lesson.id}`} className="analyze-btn" style={{ textDecoration: 'none' }}>
            <PlayCircle size={16} /> {totalDone === 0 ? 'Start Course' : 'Continue Learning'}
          </Link>
        )}
      </div>

      {/* Overall progress */}
      <div className="academy-progress-card">
        <div className="academy-progress-header">
          <div>
            <div className="academy-progress-label">Your progress</div>
            <div className="academy-progress-count">{totalDone} / {TOTAL_LESSONS} lessons completed</div>
          </div>
          <div className="academy-progress-pct">{pct}%</div>
        </div>
        <div className="academy-progress-bar">
          <div className="academy-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Module grid */}
      <div className="academy-modules-grid">
        {COURSE.map((m, idx) => {
          const done = m.lessons.filter(l => completed.has(l.id)).length;
          const modPct = Math.round((done / m.lessons.length) * 100);
          const isComplete = done === m.lessons.length;
          return (
            <Link to={`/academy/${m.id}`} key={m.id} className="academy-module-card">
              <div className="academy-module-number">{String(idx + 1).padStart(2, '0')}</div>
              <div className="academy-module-body">
                <h3 className="academy-module-title">
                  {m.title.replace(/^Module \d+ · /, '')}
                  {isComplete && <CheckCircle2 size={16} style={{ marginLeft: 6, color: 'var(--color-success, #22c55e)' }} />}
                </h3>
                <p className="academy-module-summary">{m.summary}</p>
                <div className="academy-module-meta">
                  <span><Clock size={12} /> {m.lessons.length} lessons</span>
                  <span>{done} / {m.lessons.length} done</span>
                </div>
                <div className="academy-mini-bar">
                  <div className="academy-mini-fill" style={{ width: `${modPct}%` }} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
