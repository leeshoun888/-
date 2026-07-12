import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Gift,
  Heart,
  LockKey,
  RocketLaunch,
  SpeakerHigh,
  SpeakerSlash,
  Sparkle,
  Star,
} from "@phosphor-icons/react";
import "@fontsource/jua";
import "@fontsource/gowun-dodum";
import { chapters, totalPhotos } from "./data/chapters.js";

const STORAGE_KEY = "kkongal-chongchong-memory-progress-v2";
const DEV_PREVIEW = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
const PREVIEW_SCREENS = new Set(["intro", "map", "album", "mission", "finale"]);
const previewScreen = PREVIEW_SCREENS.has(DEV_PREVIEW?.get("screen")) ? DEV_PREVIEW.get("screen") : null;
const previewChapter = DEV_PREVIEW?.has("chapter")
  ? Math.min(chapters.length - 1, Math.max(0, Number.parseInt(DEV_PREVIEW.get("chapter"), 10) - 1 || 0))
  : null;

function playChime(enabled, notes = [523.25, 659.25, 783.99]) {
  if (!enabled || typeof window === "undefined") return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.14, context.currentTime + index * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.09 + 0.45);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + index * 0.09);
    oscillator.stop(context.currentTime + index * 0.09 + 0.48);
  });
  window.setTimeout(() => context.close(), 900);
}

function SoundButton({ enabled, onToggle }) {
  const Icon = enabled ? SpeakerHigh : SpeakerSlash;
  return (
    <button className="icon-button sound-button" onClick={onToggle} aria-label={enabled ? "소리 끄기" : "소리 켜기"}>
      <Icon size={20} weight="fill" />
    </button>
  );
}

function ProgressStars({ completed, active, onSelect }) {
  return (
    <div className="progress-stars" aria-label={`추억 복구 ${completed}/10`}>
      {chapters.map((chapter, index) => {
        const isComplete = index < completed;
        const isUnlocked = index <= completed;
        const isActive = index === active;
        return (
          <button
            key={chapter.id}
            className={`progress-node ${isComplete ? "is-complete" : ""} ${isActive ? "is-active" : ""}`}
            disabled={!isUnlocked}
            onClick={() => onSelect?.(index)}
            aria-label={`${index + 1}번째 행성 ${isComplete ? "복구 완료" : isUnlocked ? "선택 가능" : "잠김"}`}
          >
            {isUnlocked ? <Star size={13} weight={isComplete || isActive ? "fill" : "regular"} /> : <LockKey size={11} weight="fill" />}
          </button>
        );
      })}
    </div>
  );
}

function PlanetStage({ photo, tilt = { x: 0, y: 0 } }) {
  return (
    <div
      className="planet-stage"
      style={{ transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0) scale(1.025)` }}
      aria-hidden="true"
    >
      <img className="planet-art" src="/assets/planet-stage-cropped.jpg" alt="" />
      <img className="planet-photo" src={photo.src} alt="" draggable="false" />
    </div>
  );
}

function IntroScreen({ sound, onToggleSound, onStart }) {
  const firstPhoto = chapters[0].cover;
  return (
    <motion.section className="screen intro-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <PlanetStage photo={firstPhoto} />
      <div className="screen-shade" />
      <SoundButton enabled={sound} onToggle={onToggleSound} />
      <div className="intro-copy">
        <span className="eyebrow">꽁알이 전용 · DAY 100</span>
        <h1>우리의 기억이<br />우주에 흩어졌대!</h1>
        <p>총총이가 숨겨둔 10개의 추억 행성을 여행하며<br />우리의 반짝였던 순간을 다시 만나봐.</p>
      </div>
      <div className="bottom-actions intro-actions">
        <button className="primary-button" onClick={onStart}>
          <RocketLaunch size={22} weight="fill" />
          기억 복구 작전 시작
        </button>
        <span className="micro-copy">사진 {totalPhotos}장 · 약 7분의 작은 우주여행</span>
      </div>
    </motion.section>
  );
}

function MapScreen({ completed, active, setActive, sound, onToggleSound, onOpen, onFinale }) {
  const chapter = chapters[active];
  const percentage = Math.round((completed / chapters.length) * 100);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handlePointerMove = (event) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 8,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 6,
    });
  };

  return (
    <motion.section className="screen map-screen" onPointerMove={handlePointerMove} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <PlanetStage photo={chapter.cover} tilt={tilt} />
      <div className="screen-shade map-shade" />
      <SoundButton enabled={sound} onToggle={onToggleSound} />
      <header className="map-header">
        <div className="progress-label">
          <span>기억 복구율</span>
          <strong>{percentage}%</strong>
        </div>
        <ProgressStars completed={completed} active={active} onSelect={setActive} />
      </header>
      <div className="map-title">
        <span className="eyebrow">CHAPTER {String(chapter.number).padStart(2, "0")} · {chapter.eyebrow}</span>
        <h2>{chapter.title}</h2>
        <p>{chapter.note}</p>
      </div>
      <div className="bottom-actions">
        {completed === chapters.length && active === chapters.length - 1 ? (
          <button className="primary-button" onClick={onFinale}>
            <Gift size={22} weight="fill" />
            선물 엔딩 다시 보기
          </button>
        ) : (
          <button className="primary-button" onClick={onOpen} disabled={active > completed}>
            <Star size={22} weight="fill" />
            {active < completed ? "추억 다시 보기" : "추억 복구하기"}
          </button>
        )}
        <span className="micro-copy">{chapter.dates[0].slice(5).replace("-", ".")} — {chapter.dates.at(-1).slice(5).replace("-", ".")}</span>
      </div>
    </motion.section>
  );
}

function AlbumScreen({ chapter, onBack, onMission }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = chapter.photos[photoIndex];
  const isLast = photoIndex === chapter.photos.length - 1;

  useEffect(() => {
    const next = chapter.photos[photoIndex + 1];
    if (next) {
      const image = new Image();
      image.src = next.src;
    }
  }, [chapter.photos, photoIndex]);

  const move = (direction) => {
    setPhotoIndex((current) => Math.min(chapter.photos.length - 1, Math.max(0, current + direction)));
  };

  return (
    <motion.section className="screen album-screen" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
      <img className="universe-bg" src="/assets/memory-universe-bg.jpg" alt="" />
      <div className="screen-shade album-shade" />
      <header className="album-header">
        <button className="icon-button" onClick={onBack} aria-label="행성 지도로 돌아가기"><ArrowLeft size={21} weight="bold" /></button>
        <div>
          <span>CHAPTER {String(chapter.number).padStart(2, "0")}</span>
          <strong>{chapter.title}</strong>
        </div>
        <span className="photo-count">{photoIndex + 1}/{chapter.photos.length}</span>
      </header>

      <div className="photo-progress"><span style={{ width: `${((photoIndex + 1) / chapter.photos.length) * 100}%` }} /></div>

      <AnimatePresence mode="wait">
        <motion.article
          key={photo.id}
          className="memory-card"
          initial={{ opacity: 0, scale: 0.96, rotateY: 6 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.97, rotateY: -6 }}
          transition={{ duration: 0.24 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            if (info.offset.x < -55) move(1);
            if (info.offset.x > 55) move(-1);
          }}
        >
          <div className="memory-photo-wrap">
            <img src={photo.src} alt={`${photo.displayDate} ${photo.caption}`} draggable="false" loading="eager" />
          </div>
          <div className="memory-caption">
            <span>{photo.displayDate}</span>
            <h3>{photo.caption}</h3>
          </div>
        </motion.article>
      </AnimatePresence>

      {chapter.firstDateStory && photoIndex === 0 && (
        <aside className="story-note">
          <Sparkle size={16} weight="fill" />
          <p><strong>총총이의 첫 데이트 기록</strong>{chapter.firstDateStory}</p>
        </aside>
      )}

      <div className="album-controls">
        <button className="secondary-button square-button" onClick={() => move(-1)} disabled={photoIndex === 0} aria-label="이전 사진">
          <ArrowLeft size={20} weight="bold" />
        </button>
        <button className="primary-button compact-button" onClick={() => (isLast ? onMission() : move(1))}>
          {isLast ? "행성 미션 시작" : "다음 추억"}
          {isLast ? <Sparkle size={20} weight="fill" /> : <ArrowRight size={20} weight="bold" />}
        </button>
      </div>
    </motion.section>
  );
}

function MissionAction({ type, progress, setProgress }) {
  const holdFrame = useRef(null);
  const holdStart = useRef(0);
  const swipeState = useRef({ active: false, x: 0 });
  const dragState = useRef({ active: false, left: 0, width: 1 });

  useEffect(() => () => cancelAnimationFrame(holdFrame.current), []);

  const startHold = (event) => {
    cancelAnimationFrame(holdFrame.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    holdStart.current = performance.now() - progress * 18;
    const tick = (now) => {
      const next = Math.min(100, (now - holdStart.current) / 18);
      setProgress(next);
      if (next < 100) holdFrame.current = requestAnimationFrame(tick);
    };
    holdFrame.current = requestAnimationFrame(tick);
  };

  const stopHold = () => cancelAnimationFrame(holdFrame.current);

  if (type === "tap") {
    return (
      <button className="mission-heart" onClick={() => setProgress((value) => Math.min(100, value + 16.7))}>
        <Heart size={70} weight="fill" />
        <span>톡톡!</span>
      </button>
    );
  }

  if (type === "hold") {
    return (
      <button
        className="mission-heart hold-heart"
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onClick={() => setProgress((value) => Math.min(100, value + 12.5))}
        aria-label="하트를 길게 누르거나 여러 번 눌러 마음 전하기"
      >
        <Heart size={70} weight="fill" />
        <span>꾹 누르기</span>
      </button>
    );
  }

  if (type === "drag") {
    return (
      <div
        className="drag-zone"
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          dragState.current = { active: true, left: rect.left, width: rect.width };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragState.current.active) return;
          const travel = dragState.current.width - 54;
          const offset = Math.min(travel, Math.max(0, event.clientX - dragState.current.left - 27));
          setProgress((offset / travel) * 100);
        }}
        onPointerUp={(event) => {
          const travel = dragState.current.width - 54;
          const offset = Math.min(travel, Math.max(0, event.clientX - dragState.current.left - 27));
          dragState.current.active = false;
          setProgress(offset / travel > 0.72 ? 100 : 0);
        }}
        onPointerCancel={() => {
          dragState.current.active = false;
          setProgress(0);
        }}
      >
        <Star className="destination-star" size={34} weight="fill" />
        <button
          className="rocket-drag"
          style={{ transform: `translateX(${progress * 2.12}px)` }}
          aria-label="우주선을 별까지 드래그하기"
        >
          <RocketLaunch size={34} weight="fill" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="swipe-zone"
      onPointerDown={(event) => {
        swipeState.current = { active: true, x: event.clientX };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!swipeState.current.active) return;
        const distance = Math.abs(event.clientX - swipeState.current.x);
        swipeState.current.x = event.clientX;
        setProgress((value) => Math.min(100, value + distance * 0.48));
      }}
      onPointerUp={() => { swipeState.current.active = false; }}
      onPointerCancel={() => { swipeState.current.active = false; }}
    >
      <Sparkle size={54} weight="fill" />
      <span>좌우로 살살 문질러주세요</span>
    </div>
  );
}

function MissionScreen({ chapter, sound, onBack, onComplete }) {
  const [progress, setProgress] = useState(0);
  const done = progress >= 100;
  const chimed = useRef(false);

  useEffect(() => {
    if (done && !chimed.current) {
      chimed.current = true;
      playChime(sound);
    }
  }, [done, sound]);

  return (
    <motion.section className="screen mission-screen" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <img className="universe-bg" src="/assets/memory-universe-bg.jpg" alt="" />
      <div className="screen-shade mission-shade" />
      <header className="mission-header">
        <button className="icon-button" onClick={onBack} aria-label="사진첩으로 돌아가기"><ArrowLeft size={21} weight="bold" /></button>
        <span>행성 복구 미션</span>
      </header>

      <div className="mission-copy">
        <span className="eyebrow">MISSION {String(chapter.number).padStart(2, "0")}</span>
        <h2>{done ? "기억 복구 완료!" : chapter.mission.title}</h2>
        <p>{done ? "꽁알이의 손끝에서 추억 행성이 다시 반짝이기 시작했어." : chapter.mission.instruction}</p>
      </div>

      <div className={`mission-panel ${done ? "is-done" : ""}`}>
        <img src={chapter.cover.src} alt="" />
        <div className="mission-panel-shade" />
        {done ? (
          <motion.div className="mission-success" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <CheckCircle size={74} weight="fill" />
            <strong>추억 조각 +1</strong>
          </motion.div>
        ) : (
          <MissionAction type={chapter.mission.type} progress={progress} setProgress={setProgress} />
        )}
      </div>

      <div className="mission-meter">
        <span style={{ width: `${progress}%` }} />
      </div>
      <span className="mission-percent">복구 에너지 {Math.round(progress)}%</span>

      <div className="bottom-actions">
        <button className="primary-button" disabled={!done} onClick={onComplete}>
          {chapter.number === chapters.length ? <Gift size={22} weight="fill" /> : <RocketLaunch size={22} weight="fill" />}
          {chapter.number === chapters.length ? "마지막 문 열기" : "다음 행성으로 출발"}
        </button>
      </div>
    </motion.section>
  );
}

function FinaleScreen({ sound, onBackToMap }) {
  const [arrived, setArrived] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [journeyProgress, setJourneyProgress] = useState(0);
  const journeyDrag = useRef({ active: false, left: 0, width: 1 });

  const arrive = () => {
    if (arrived) return;
    setArrived(true);
    playChime(sound, [523.25, 659.25, 783.99, 1046.5]);
    window.setTimeout(() => setRevealed(true), 650);
  };

  return (
    <motion.section className="screen finale-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <img className="finale-bg" src="/assets/gift-finale-bg.jpg" alt="선물 상자가 놓인 반짝이는 추억 행성" />
      <div className="screen-shade finale-shade" />
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div className="final-mission" key="mission" exit={{ opacity: 0, y: -20 }}>
            <span className="eyebrow">FINAL MISSION</span>
            <h2>총총이 별을<br />꽁알이에게 보내줘</h2>
            <p>어려운 문제는 없어. 보고 싶은 마음만 오른쪽으로 살며시 밀어줘.</p>
            <div
              className="final-journey"
              onPointerDown={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                journeyDrag.current = { active: true, left: rect.left, width: rect.width };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!journeyDrag.current.active || arrived) return;
                const travel = journeyDrag.current.width - 56;
                const offset = Math.min(travel, Math.max(0, event.clientX - journeyDrag.current.left - 28));
                setJourneyProgress((offset / travel) * 100);
              }}
              onPointerUp={(event) => {
                if (arrived) return;
                const travel = journeyDrag.current.width - 56;
                const offset = Math.min(travel, Math.max(0, event.clientX - journeyDrag.current.left - 28));
                journeyDrag.current.active = false;
                if (offset / travel > 0.72) {
                  setJourneyProgress(100);
                  arrive();
                } else {
                  setJourneyProgress(0);
                }
              }}
              onPointerCancel={() => {
                journeyDrag.current.active = false;
                setJourneyProgress(0);
              }}
            >
              <span className="journey-label sender">총총이</span>
              <span className="journey-label receiver">꽁알이</span>
              <Heart className="journey-heart" size={34} weight="fill" />
              <button
                className="final-rocket"
                style={{ transform: `translateX(${journeyProgress * 2.38}px) scale(${arrived ? 1.12 : 1})` }}
                aria-label="총총이 별을 꽁알이에게 보내기"
              >
                <RocketLaunch size={34} weight="fill" />
              </button>
            </div>
            <span className="drag-hint">오른쪽으로 드래그</span>
          </motion.div>
        ) : (
          <motion.div className="gift-reveal" key="gift" initial={{ opacity: 0, scale: 0.84 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
            <span className="eyebrow">MEMORY RESTORED · 100%</span>
            <h2>꽁알아,<br />우리의 100일 우주가<br />완성됐어!</h2>
            <p>이제 잠깐 화면에서 눈을 떼고<br />바로 앞에 있는 총총이를 바라봐.</p>
            <div className="gift-message">
              <Gift size={34} weight="fill" />
              <strong>총총이에게<br />선물을 받으세요!</strong>
            </div>
            <button className="secondary-button finale-button" onClick={onBackToMap}>우리 별들 다시 보기</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export function App() {
  const [screen, setScreen] = useState(previewScreen ?? "intro");
  const [sound, setSound] = useState(true);
  const [completed, setCompleted] = useState(() => {
    const stored = Number.parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    return Number.isFinite(stored) ? Math.min(chapters.length, Math.max(0, stored)) : 0;
  });
  const [active, setActive] = useState(() => previewChapter ?? Math.min(chapters.length - 1, completed));

  const chapter = chapters[active];

  const completeChapter = () => {
    const nextCompleted = Math.max(completed, active + 1);
    setCompleted(nextCompleted);
    localStorage.setItem(STORAGE_KEY, String(nextCompleted));
    if (active === chapters.length - 1) {
      setScreen("finale");
      return;
    }
    setActive(Math.min(chapters.length - 1, active + 1));
    setScreen("map");
  };

  return (
    <main className="mobile-prototype" aria-live="polite">
      <AnimatePresence mode="wait">
        {screen === "intro" && (
          <IntroScreen key="intro" sound={sound} onToggleSound={() => setSound((value) => !value)} onStart={() => setScreen("map")} />
        )}
        {screen === "map" && (
          <MapScreen
            key="map"
            completed={completed}
            active={active}
            setActive={setActive}
            sound={sound}
            onToggleSound={() => setSound((value) => !value)}
            onOpen={() => setScreen("album")}
            onFinale={() => setScreen("finale")}
          />
        )}
        {screen === "album" && (
          <AlbumScreen key={`album-${active}`} chapter={chapter} onBack={() => setScreen("map")} onMission={() => setScreen("mission")} />
        )}
        {screen === "mission" && (
          <MissionScreen key={`mission-${active}`} chapter={chapter} sound={sound} onBack={() => setScreen("album")} onComplete={completeChapter} />
        )}
        {screen === "finale" && (
          <FinaleScreen key="finale" sound={sound} onBackToMap={() => { setActive(chapters.length - 1); setScreen("map"); }} />
        )}
      </AnimatePresence>
    </main>
  );
}
