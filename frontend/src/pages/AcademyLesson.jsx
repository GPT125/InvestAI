import { useState, useMemo } from 'react';
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
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

function saveCompleted(userId, set) {
  try {
    localStorage.setItem(`investai-academy-${userId || 'guest'}`, JSON.stringify(Array.from(set)));
  } catch {}
}

/** Very small markdown → JSX for bold/italic/lists/line breaks. */
function renderBody(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const blocks = [];
  let list = [];
  const flushList = () => {
    if (list.length) { blocks.push(<ul key={`ul-${blocks.length}`}>{list.map((li, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inline(li) }} />)}</ul>); list = []; }
  };
  const inline = (s) =>
    s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (/^\s*-\s+/.test(line)) {
      list.push(line.replace(/^\s*-\s+/, ''));
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      blocks.push(<p key={`p-${idx}`} dangerouslySetInnerHTML={{ __html: inline(line) }} />);
    }
  });
  flushList();
  return blocks;
}

export default function AcademyLesson() {
  const { moduleId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const mod = COURSE.find(m => m.id === moduleId);
  const lesson = mod?.lessons.find(l => l.id === lessonId);

  const [completed, setCompleted] = useState(() => loadCompleted(user?.id));
  // Quiz state
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Prev / next lesson navigation across modules
  const flat = useMemo(() => COURSE.flatMap(m => m.lessons.map(l => ({ modId: m.id, lessonId: l.id }))), []);
  const currentIdx = flat.findIndex(x => x.modId === moduleId && x.lessonId === lessonId);
  const prev = currentIdx > 0 ? flat[currentIdx - 1] : null;
  const next = currentIdx < flat.length - 1 ? flat[currentIdx + 1] : null;

  if (!mod || !lesson) return <Navigate to="/academy" replace />;

  const isDone = completed.has(lesson.id);

  const markComplete = () => {
    const newSet = new Set(completed);
    if (isDone) newSet.delete(lesson.id); else newSet.add(lesson.id);
    setCompleted(newSet);
    saveCompleted(user?.id, newSet);
  };

  const completeAndNext = () => {
    const newSet = new Set(completed);
    newSet.add(lesson.id);
    setCompleted(newSet);
    saveCompleted(user?.id, newSet);
    if (next) navigate(`/academy/${next.modId}/${next.lessonId}`);
    else navigate('/academy');
  };

  const submitQuiz = () => {
    setSubmitted(true);
    const all = lesson.questions?.every((q, i) => answers[i] === q.correct);
    if (all) {
      const newSet = new Set(completed);
      newSet.add(lesson.id);
      setCompleted(newSet);
      saveCompleted(user?.id, newSet);
    }
  };

  const score = submitted && lesson.questions
    ? lesson.questions.filter((q, i) => answers[i] === q.correct).length
    : 0;

  return (
    <div className="dashboard">
      <Link to={`/academy/${mod.id}`} className="academy-back-link"><ArrowLeft size={16} /> {mod.title.replace(/^Module \d+ · /, '')}</Link>

      <div className="academy-lesson-page">
        <div className="academy-lesson-eyebrow">
          {mod.title} · Lesson {mod.lessons.findIndex(l => l.id === lesson.id) + 1} of {mod.lessons.length}
        </div>
        <h1 className="academy-lesson-h1">{lesson.title}</h1>

        {/* Video */}
        {lesson.kind === 'video' && lesson.video && (
          <div className="academy-video-wrap">
            <iframe
              src={lesson.video}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Body text (video + text + activity all use this) */}
        {(lesson.kind === 'video' || lesson.kind === 'text' || lesson.kind === 'activity') && lesson.body && (
          <div className="academy-lesson-body">{renderBody(lesson.body)}</div>
        )}

        {/* Activity CTA */}
        {lesson.kind === 'activity' && lesson.cta && (
          <Link to={lesson.cta.path} className="analyze-btn" style={{ textDecoration: 'none', marginTop: 12, display: 'inline-flex' }}>
            {lesson.cta.label} <ExternalLink size={14} />
          </Link>
        )}

        {/* Quiz */}
        {lesson.kind === 'quiz' && lesson.questions && (
          <div className="academy-quiz">
            {lesson.questions.map((q, qi) => (
              <div key={qi} className="academy-quiz-q">
                <div className="academy-quiz-question">{qi + 1}. {q.q}</div>
                <div className="academy-quiz-options">
                  {q.options.map((opt, oi) => {
                    const picked = answers[qi] === oi;
                    const correct = submitted && oi === q.correct;
                    const wrong = submitted && picked && oi !== q.correct;
                    return (
                      <button
                        key={oi}
                        className={`academy-quiz-option ${picked ? 'picked' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}
                        disabled={submitted}
                        onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!submitted ? (
              <button
                className="analyze-btn"
                disabled={Object.keys(answers).length !== lesson.questions.length}
                onClick={submitQuiz}
              >
                Submit Quiz
              </button>
            ) : (
              <div className="academy-quiz-result">
                You scored {score} / {lesson.questions.length}
                {score === lesson.questions.length ? ' — perfect! Lesson marked complete.' : ' — try again to complete this lesson.'}
                {score !== lesson.questions.length && (
                  <button className="analyze-btn" onClick={() => { setSubmitted(false); setAnswers({}); }} style={{ marginLeft: 12 }}>
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual complete toggle (for non-quiz lessons) */}
        {lesson.kind !== 'quiz' && (
          <button className="academy-complete-btn" onClick={markComplete}>
            {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            {isDone ? 'Completed' : 'Mark as complete'}
          </button>
        )}

        {/* Prev / next */}
        <div className="academy-lesson-nav">
          {prev ? (
            <Link to={`/academy/${prev.modId}/${prev.lessonId}`} className="academy-nav-btn">
              <ArrowLeft size={14} /> Previous
            </Link>
          ) : <span />}
          {next ? (
            <button className="academy-nav-btn primary" onClick={completeAndNext}>
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <Link to="/academy" className="academy-nav-btn primary">Finish course</Link>
          )}
        </div>
      </div>
    </div>
  );
}
