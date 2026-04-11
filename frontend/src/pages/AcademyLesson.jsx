import { useState, useMemo, useCallback } from 'react';
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ExternalLink, RefreshCw, Shuffle } from 'lucide-react';
import { COURSES, findCourse, findLesson, flatLessons } from '../data/academyCourses';
import { useAuth } from '../context/AuthContext';
import AcademyGame from '../components/Academy/AcademyGames';

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

/** Very small markdown to JSX for bold/italic/lists/line breaks. */
function renderBody(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const blocks = [];
  let list = [];
  const flushList = () => {
    if (list.length) {
      blocks.push(<ul key={`ul-${blocks.length}`}>{list.map((li, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inline(li) }} />)}</ul>);
      list = [];
    }
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

/**
 * Shuffles an array using Fisher-Yates with a seeded PRNG.
 * Returns a new shuffled array + a mapping from new index to original index.
 */
function seededShuffle(arr, seed) {
  const result = arr.map((v, i) => ({ v, origIdx: i }));
  let s = seed;
  const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function AcademyLesson() {
  const { moduleId, lessonId } = useParams(); // moduleId = courseId
  const navigate = useNavigate();
  const { user } = useAuth();

  const course = findCourse(moduleId);
  const lesson = course ? findLesson(moduleId, lessonId) : null;

  const [completed, setCompleted] = useState(() => loadCompleted(user?.id));
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [quizSeed, setQuizSeed] = useState(() => Date.now());

  // Build shuffled questions with shuffled options for each quiz attempt
  const shuffledQuiz = useMemo(() => {
    if (!lesson || lesson.kind !== 'quiz' || !lesson.questions) return null;
    const shuffledQs = seededShuffle(lesson.questions, quizSeed);
    return shuffledQs.map(({ v: q, origIdx }) => {
      const optShuffle = seededShuffle(q.options, quizSeed + origIdx * 997);
      const newCorrectIdx = optShuffle.findIndex(o => o.origIdx === q.correct);
      return {
        q: q.q,
        options: optShuffle.map(o => o.v),
        correct: newCorrectIdx,
      };
    });
  }, [lesson, quizSeed]);

  // Prev / next lesson navigation across ALL courses
  const allFlat = useMemo(() => flatLessons(), []);
  const currentIdx = allFlat.findIndex(x => x.courseId === moduleId && x.lessonId === lessonId);
  const prev = currentIdx > 0 ? allFlat[currentIdx - 1] : null;
  const next = currentIdx < allFlat.length - 1 ? allFlat[currentIdx + 1] : null;

  if (!course || !lesson) return <Navigate to="/academy" replace />;

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
    if (next) navigate(`/academy/${next.courseId}/${next.lessonId}`);
    else navigate(`/academy/${moduleId}`);
  };

  const submitQuiz = () => {
    setSubmitted(true);
    const questions = shuffledQuiz || lesson.questions;
    const all = questions?.every((q, i) => answers[i] === q.correct);
    if (all) {
      const newSet = new Set(completed);
      newSet.add(lesson.id);
      setCompleted(newSet);
      saveCompleted(user?.id, newSet);
    }
  };

  const retryQuiz = () => {
    setSubmitted(false);
    setAnswers({});
    setQuizSeed(Date.now()); // New seed = new question/option order
  };

  const questions = shuffledQuiz || lesson.questions;
  const score = submitted && questions
    ? questions.filter((q, i) => answers[i] === q.correct).length
    : 0;

  const lessonIdx = course.lessons.findIndex(l => l.id === lesson.id);

  return (
    <div className="dashboard">
      <Link to={`/academy/${course.id}`} className="academy-back-link">
        <ArrowLeft size={16} /> {course.title}
      </Link>

      <div className="academy-lesson-page">
        <div className="academy-lesson-eyebrow">
          {course.icon} {course.title} · Lesson {lessonIdx + 1} of {course.lessons.length}
        </div>
        <h1 className="academy-lesson-h1">{lesson.title}</h1>

        {/* Video */}
        {lesson.kind === 'video' && lesson.video && (
          <>
            <div className="academy-video-wrap">
              <iframe
                src={lesson.video}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <a
              href={(() => {
                const m = lesson.video.match(/\/embed\/([^?&/]+)/);
                return m ? `https://www.youtube.com/watch?v=${m[1]}` : lesson.video;
              })()}
              target="_blank"
              rel="noopener noreferrer"
              className="academy-video-fallback"
            >
              <ExternalLink size={14} /> Watch on YouTube if video doesn't load
            </a>
          </>
        )}

        {/* Body text (video + text + activity all use this) */}
        {(lesson.kind === 'video' || lesson.kind === 'text' || lesson.kind === 'activity') && lesson.body && (
          <div className="academy-lesson-body">{renderBody(lesson.body)}</div>
        )}

        {/* Interactive game */}
        {lesson.kind === 'game' && (
          <>
            {lesson.body && <div className="academy-lesson-body" style={{ marginBottom: 16 }}>{renderBody(lesson.body)}</div>}
            <AcademyGame game={lesson.game} />
          </>
        )}

        {/* Activity CTA */}
        {lesson.kind === 'activity' && lesson.cta && (
          <Link to={lesson.cta.path} className="analyze-btn" style={{ textDecoration: 'none', marginTop: 12, display: 'inline-flex' }}>
            {lesson.cta.label} <ExternalLink size={14} />
          </Link>
        )}

        {/* Quiz — uses shuffled questions */}
        {lesson.kind === 'quiz' && questions && (
          <div className="academy-quiz">
            <div className="academy-quiz-shuffle-note">
              <Shuffle size={14} /> Questions and options are shuffled each attempt
            </div>
            {questions.map((q, qi) => (
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
                disabled={Object.keys(answers).length !== questions.length}
                onClick={submitQuiz}
              >
                Submit Quiz
              </button>
            ) : (
              <div className="academy-quiz-result">
                You scored {score} / {questions.length}
                {score === questions.length
                  ? ' — perfect! Lesson marked complete.'
                  : ' — review the answers above and try again.'}
                {score !== questions.length && (
                  <button className="analyze-btn" onClick={retryQuiz} style={{ marginLeft: 12 }}>
                    <RefreshCw size={14} /> Retry (shuffled)
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
            <Link to={`/academy/${prev.courseId}/${prev.lessonId}`} className="academy-nav-btn">
              <ArrowLeft size={14} /> Previous
            </Link>
          ) : <span />}
          {next ? (
            <button className="academy-nav-btn primary" onClick={completeAndNext}>
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <Link to={`/academy/${moduleId}`} className="academy-nav-btn primary">Finish course</Link>
          )}
        </div>
      </div>
    </div>
  );
}
