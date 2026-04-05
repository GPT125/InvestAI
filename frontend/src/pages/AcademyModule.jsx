import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Play, FileText, ClipboardList, Target } from 'lucide-react';
import { COURSE } from '../data/academyCourse';
import { useAuth } from '../context/AuthContext';

function loadCompleted(userId) {
  try {
    const raw = localStorage.getItem(`investai-academy-${userId || 'guest'}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

const KIND_ICON = {
  video: Play,
  text: FileText,
  quiz: ClipboardList,
  activity: Target,
};

const KIND_LABEL = {
  video: 'Video + Notes',
  text: 'Reading',
  quiz: 'Quiz',
  activity: 'Hands-on Activity',
};

export default function AcademyModule() {
  const { moduleId } = useParams();
  const { user } = useAuth();
  const mod = COURSE.find(m => m.id === moduleId);

  if (!mod) return <Navigate to="/academy" replace />;

  const completed = loadCompleted(user?.id);
  const done = mod.lessons.filter(l => completed.has(l.id)).length;
  const pct = Math.round((done / mod.lessons.length) * 100);

  const modIndex = COURSE.findIndex(m => m.id === moduleId);
  const prevMod = modIndex > 0 ? COURSE[modIndex - 1] : null;
  const nextMod = modIndex < COURSE.length - 1 ? COURSE[modIndex + 1] : null;

  return (
    <div className="dashboard">
      <Link to="/academy" className="academy-back-link"><ArrowLeft size={16} /> Back to Academy</Link>

      <div className="dashboard-header" style={{ marginTop: 8 }}>
        <div>
          <div className="academy-module-eyebrow">Module {modIndex + 1} of {COURSE.length}</div>
          <h1>{mod.title.replace(/^Module \d+ · /, '')}</h1>
          <span className="dashboard-date">{mod.summary}</span>
        </div>
      </div>

      {/* Module progress */}
      <div className="academy-progress-card">
        <div className="academy-progress-header">
          <div>
            <div className="academy-progress-label">Module progress</div>
            <div className="academy-progress-count">{done} / {mod.lessons.length} lessons completed</div>
          </div>
          <div className="academy-progress-pct">{pct}%</div>
        </div>
        <div className="academy-progress-bar">
          <div className="academy-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Lesson list */}
      <div className="academy-lesson-list">
        {mod.lessons.map((l, i) => {
          const Icon = KIND_ICON[l.kind] || FileText;
          const isDone = completed.has(l.id);
          return (
            <Link to={`/academy/${mod.id}/${l.id}`} key={l.id} className={`academy-lesson-row ${isDone ? 'done' : ''}`}>
              <div className="academy-lesson-num">{i + 1}</div>
              <div className="academy-lesson-icon"><Icon size={18} /></div>
              <div className="academy-lesson-info">
                <div className="academy-lesson-title">{l.title}</div>
                <div className="academy-lesson-kind">{KIND_LABEL[l.kind] || l.kind}</div>
              </div>
              {isDone && <CheckCircle2 size={18} className="academy-lesson-check" />}
            </Link>
          );
        })}
      </div>

      {/* Prev / next module */}
      <div className="academy-module-nav">
        {prevMod ? (
          <Link to={`/academy/${prevMod.id}`} className="academy-nav-btn">
            <ArrowLeft size={14} /> {prevMod.title.replace(/^Module \d+ · /, '')}
          </Link>
        ) : <span />}
        {nextMod ? (
          <Link to={`/academy/${nextMod.id}`} className="academy-nav-btn">
            {nextMod.title.replace(/^Module \d+ · /, '')} →
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
