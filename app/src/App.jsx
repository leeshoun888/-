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
import { romanticAudio } from "./audio/romanticAudio.js";

const STORAGE_KEY = "kkongal-chongchong-memory-progress-v2";
const DEV_PREVIEW = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
const PREVIEW_SCREENS = new Set(["intro", "map", "album", "mission", "finale"]);
const previewScreen = PREVIEW_SCREENS.has(DEV_PREVIEW?.get("screen")) ? DEV_PREVIEW.get("screen") : null;
const previewChapter = DEV_PREVIEW?.has("chapter")
  ? Math.min(chapters.length - 1, Math.max(0, Number.parseInt(DEV_PREVIEW.get("chapter"), 10) - 1 || 0))
  : null;
const FINALE_PHASES = new Set(["journey", "convergence", "gift", "open", "reveal"]);
const previewFinalePhase = FINALE_PHASES.has(DEV_PREVIEW?.get("finale")) ? DEV_PREVIEW.get("finale") : null;

function playChime(enabled, notes = [523.25, 659.25, 783.99]) {
  if (enabled) romanticAudio.playChime(notes);
}

function playFinaleCue(enabled, cue) {
  if (enabled) romanticAudio.sfx(cue === "arrival" ? "finaleArrival" : "finaleOpen");
}

function SoundButton({ enabled, onToggle, inline = false }) {
  const Icon = enabled ? SpeakerHigh : SpeakerSlash;
  return (
    <button className={`icon-button sound-button ${inline ? "inline-sound-button" : ""}`} onClick={onToggle} aria-label={enabled ? "소리 끄기" : "소리 켜기"}>
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

const planetPositions = [
  { x: 15, y: 29, size: 84, depth: -3 },
  { x: 50, y: 27, size: 78, depth: 2 },
  { x: 84, y: 31, size: 88, depth: -2 },
  { x: 25, y: 44, size: 82, depth: 3 },
  { x: 69, y: 44, size: 91, depth: -3 },
  { x: 14, y: 61, size: 76, depth: 2 },
  { x: 50, y: 59, size: 86, depth: -2 },
  { x: 84, y: 62, size: 78, depth: 3 },
  { x: 30, y: 78, size: 84, depth: -2 },
  { x: 70, y: 78, size: 96, depth: 2 },
];

function MapScreen({ completed, active, setActive, sound, onToggleSound, onOpen, onFinale }) {
  const chapter = chapters[active];
  const percentage = Math.round((completed / chapters.length) * 100);
  const isFinalComplete = completed === chapters.length && active === chapters.length - 1;
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    chapters.forEach((_, index) => {
      const image = new Image();
      image.src = `/assets/planets/planet-${String(index + 1).padStart(2, "0")}.webp`;
    });
  }, []);

  const visitPlanet = (index) => {
    if (index > completed) return;
    setActive(index);
    setFocused(true);
    romanticAudio.sfx("planet");
  };

  return (
    <motion.section className={`screen map-screen galaxy-map-screen ${focused ? "is-focused" : "is-overview"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <img className="universe-bg galaxy-backdrop" src="/assets/memory-universe-bg.jpg" alt="" />
      <div className="screen-shade map-shade" />
      <SoundButton enabled={sound} onToggle={onToggleSound} />
      <header className="map-header">
        <div className="progress-label">
          <span>기억 복구율</span>
          <strong>{percentage}%</strong>
        </div>
        <ProgressStars completed={completed} active={active} onSelect={visitPlanet} />
      </header>

      <AnimatePresence>
        {!focused && (
          <motion.div className="galaxy-overview-copy" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <span className="eyebrow">KKONGAL × CHONGCHONG</span>
            <h2>우리의 100일 우주</h2>
            <p>반짝이는 행성을 눌러 추억 속으로 날아가 봐</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="galaxy-camera"
        animate={focused ? { scale: 1.18, rotateX: 3, rotateY: -2, y: -4 } : { scale: 1, rotateX: 0, rotateY: 0, y: 0 }}
        transition={{ type: "spring", stiffness: 82, damping: 18, mass: 0.9 }}
      >
        {chapters.map((item, index) => {
          const position = planetPositions[index];
          const unlocked = index <= completed;
          const selected = index === active;
          const hiddenByFocus = focused && !selected;
          return (
            <motion.button
              key={item.id}
              type="button"
              className={`galaxy-planet ${unlocked ? "is-unlocked" : "is-locked"} ${selected ? "is-selected" : ""}`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              animate={focused && selected
                ? { left: "50%", top: "43%", width: 326, height: 364, opacity: 1, zIndex: 12 }
                : { left: `${position.x}%`, top: `${position.y}%`, width: position.size, height: position.size + 30, opacity: hiddenByFocus ? 0 : 1, zIndex: selected ? 4 : 2 }}
              transition={{ type: "spring", stiffness: 78, damping: 18, mass: 0.9 }}
              onClick={() => visitPlanet(index)}
              disabled={!unlocked || (focused && selected)}
              aria-label={`${item.title} ${unlocked ? "방문하기" : "잠김"}`}
            >
              <motion.span
                className="galaxy-planet-visual"
                animate={focused && selected
                  ? { rotateZ: position.depth * 0.6, rotateY: 360, scale: 1 }
                  : { rotateZ: position.depth, rotateY: 0, scale: selected && !focused ? 1.08 : 1 }}
                transition={{ rotateY: { duration: 1.05, ease: [0.2, 0.75, 0.2, 1] }, type: "spring", stiffness: 88, damping: 17 }}
              >
                <img src={`/assets/planets/planet-${String(index + 1).padStart(2, "0")}.webp`} alt="" draggable="false" />
                <span className="planet-status-badge">
                  {unlocked ? <Star size={11} weight={index < completed ? "fill" : "regular"} /> : <LockKey size={10} weight="fill" />}
                </span>
              </motion.span>
              <motion.span className="galaxy-planet-label" animate={{ opacity: focused && selected ? 0 : 1 }}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <strong>{item.title.replace(" 행성", "")}</strong>
              </motion.span>
            </motion.button>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {focused && (
          <>
            <motion.button className="map-zoom-out" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} onClick={() => { romanticAudio.sfx("zoomOut"); setFocused(false); }}>
              <ArrowLeft size={16} weight="bold" />
              전체 성도 보기
            </motion.button>
            <motion.div className="map-title planet-focus-copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={{ delay: 0.24 }}>
              <span className="eyebrow">CHAPTER {String(chapter.number).padStart(2, "0")} · {chapter.eyebrow}</span>
              <h2>{chapter.title}</h2>
              <p>{chapter.note}</p>
            </motion.div>
            <motion.div className={`bottom-actions map-visit-actions ${isFinalComplete ? "finale-actions" : ""}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} transition={{ delay: 0.3 }}>
              {isFinalComplete ? (
                <>
                  <button className="primary-button" onClick={onOpen}>
                    <Star size={22} weight="fill" />
                    꽁알이와 총총이 행성 플레이
                  </button>
                  <button className="secondary-button map-finale-button" onClick={onFinale}>
                    <Gift size={20} weight="fill" />
                    선물 엔딩 다시 보기
                  </button>
                </>
              ) : (
                <button className="primary-button" onClick={onOpen} disabled={active > completed}>
                  <RocketLaunch size={22} weight="fill" />
                  {active < completed ? "이 행성 다시 방문하기" : "이 행성에 착륙하기"}
                </button>
              )}
              <span className="micro-copy">{chapter.dates[0].slice(5).replace("-", ".")} — {chapter.dates.at(-1).slice(5).replace("-", ".")}</span>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!focused && (
          <motion.div className="map-orbit-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Star size={13} weight="fill" />
            {completed === chapters.length ? "10개의 행성을 자유롭게 여행해봐" : `${completed + 1}번째 행성이 꽁알이를 기다리고 있어`}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function AlbumScreen({ chapter, sound, onToggleSound, onBack, onMission }) {
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
    setPhotoIndex((current) => {
      const next = Math.min(chapter.photos.length - 1, Math.max(0, current + direction));
      if (next !== current) romanticAudio.sfx(direction > 0 ? "photoNext" : "photoPrev");
      return next;
    });
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
        <div className="header-audio-cluster">
          <span className="photo-count">{photoIndex + 1}/{chapter.photos.length}</span>
          <SoundButton enabled={sound} onToggle={onToggleSound} inline />
        </div>
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
    romanticAudio.sfx("holdStart");
    holdStart.current = performance.now() - progress * 18;
    const tick = (now) => {
      const next = Math.min(100, (now - holdStart.current) / 18);
      setProgress(next);
      romanticAudio.progressTick(next);
      if (next < 100) holdFrame.current = requestAnimationFrame(tick);
    };
    holdFrame.current = requestAnimationFrame(tick);
  };

  const stopHold = () => cancelAnimationFrame(holdFrame.current);

  if (type === "tap") {
    return (
      <button className="mission-heart" onClick={() => setProgress((value) => {
        const next = Math.min(100, value + 16.7);
        romanticAudio.sfx("heartTap", { progress: next });
        return next;
      })}>
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
        onClick={() => setProgress((value) => {
          const next = Math.min(100, value + 12.5);
          romanticAudio.sfx("heartTap", { progress: next });
          return next;
        })}
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
          romanticAudio.sfx("dragStart");
        }}
        onPointerMove={(event) => {
          if (!dragState.current.active) return;
          const travel = dragState.current.width - 54;
          const offset = Math.min(travel, Math.max(0, event.clientX - dragState.current.left - 27));
          const next = (offset / travel) * 100;
          setProgress(next);
          romanticAudio.progressTick(next);
        }}
        onPointerUp={(event) => {
          const travel = dragState.current.width - 54;
          const offset = Math.min(travel, Math.max(0, event.clientX - dragState.current.left - 27));
          dragState.current.active = false;
          const reached = offset / travel > 0.72;
          setProgress(reached ? 100 : 0);
          romanticAudio.sfx(reached ? "success" : "dragReset");
        }}
        onPointerCancel={() => {
          dragState.current.active = false;
          setProgress(0);
          romanticAudio.sfx("dragReset");
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
        romanticAudio.sfx("dragStart");
      }}
      onPointerMove={(event) => {
        if (!swipeState.current.active) return;
        const distance = Math.abs(event.clientX - swipeState.current.x);
        swipeState.current.x = event.clientX;
        setProgress((value) => {
          const next = Math.min(100, value + distance * 0.48);
          romanticAudio.progressTick(next);
          return next;
        });
      }}
      onPointerUp={() => { swipeState.current.active = false; }}
      onPointerCancel={() => { swipeState.current.active = false; }}
    >
      <Sparkle size={54} weight="fill" />
      <span>좌우로 살살 문질러주세요</span>
    </div>
  );
}

function MissionScreen({ chapter, sound, onToggleSound, onBack, onComplete }) {
  const [progress, setProgress] = useState(0);
  const done = progress >= 100;
  const chimed = useRef(false);

  useEffect(() => {
    if (done && !chimed.current) {
      chimed.current = true;
      romanticAudio.sfx("success");
    }
  }, [done, sound]);

  return (
    <motion.section className="screen mission-screen" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <img className="universe-bg" src="/assets/memory-universe-bg.jpg" alt="" />
      <div className="screen-shade mission-shade" />
      <header className="mission-header">
        <button className="icon-button" onClick={onBack} aria-label="사진첩으로 돌아가기"><ArrowLeft size={21} weight="bold" /></button>
        <span>행성 복구 미션</span>
        <SoundButton enabled={sound} onToggle={onToggleSound} inline />
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

const finaleBurstPieces = Array.from({ length: 26 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 26 - Math.PI / 2;
  const distance = 118 + (index % 5) * 18;
  return {
    id: `burst-${index}`,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    delay: (index % 7) * 0.035,
    rotate: index % 2 === 0 ? 120 : -140,
    kind: index % 3,
  };
});

function FinaleMemoryOrbit() {
  return (
    <motion.div
      className="final-memory-orbit"
      initial={{ opacity: 0, scale: 1.7, rotate: -35 }}
      animate={{ opacity: 1, scale: [1.7, 1, 0.78], rotate: 325 }}
      transition={{ duration: 2.35, ease: [0.2, 0.72, 0.2, 1] }}
      aria-hidden="true"
    >
      {chapters.map((chapter, index) => (
        <motion.img
          key={chapter.id}
          className="final-orbit-planet"
          src={`/assets/planets/planet-${String(index + 1).padStart(2, "0")}.webp`}
          alt=""
          style={{ transform: `translate(-50%, -50%) rotate(${index * 36}deg) translateY(-132px)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.38] }}
          transition={{ duration: 2.2, delay: index * 0.025 }}
        />
      ))}
    </motion.div>
  );
}

function FinaleBurst() {
  return (
    <div className="finale-burst" aria-hidden="true">
      {finaleBurstPieces.map((piece) => (
        <motion.span
          key={piece.id}
          className={`finale-burst-piece burst-kind-${piece.kind}`}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: 0 }}
          animate={{ x: piece.x, y: piece.y, opacity: [0, 1, 1, 0], scale: [0.2, 1.25, 0.85], rotate: piece.rotate }}
          transition={{ duration: 1.65, delay: piece.delay, ease: [0.16, 0.8, 0.22, 1] }}
        >
          {piece.kind === 0 ? <Heart size={17} weight="fill" /> : piece.kind === 1 ? <Star size={15} weight="fill" /> : <Sparkle size={16} weight="fill" />}
        </motion.span>
      ))}
    </div>
  );
}

function FinaleScreen({ sound, onToggleSound, onBackToMap }) {
  const [phase, setPhase] = useState(previewFinalePhase ?? "journey");
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const journeyDrag = useRef({ active: false, left: 0, width: 1 });
  const giftHoldFrame = useRef(null);
  const giftHoldStart = useRef(0);
  const holdProgressRef = useRef(0);
  const openedRef = useRef(phase === "open" || phase === "reveal");

  useEffect(() => {
    ["/assets/finale/gift-closed.webp", "/assets/finale/gift-open.webp", ...chapters.map((_, index) => `/assets/planets/planet-${String(index + 1).padStart(2, "0")}.webp`)].forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    holdProgressRef.current = holdProgress;
  }, [holdProgress]);

  useEffect(() => {
    if (phase !== "convergence" && phase !== "open") return undefined;
    const timeout = window.setTimeout(() => setPhase(phase === "convergence" ? "gift" : "reveal"), phase === "convergence" ? 2450 : 2550);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  useEffect(() => () => cancelAnimationFrame(giftHoldFrame.current), []);

  const arrive = () => {
    if (phase !== "journey") return;
    setJourneyProgress(100);
    setPhase("convergence");
    playFinaleCue(sound, "arrival");
    window.navigator.vibrate?.([35, 30, 70]);
  };

  const openGift = () => {
    if (openedRef.current) return;
    openedRef.current = true;
    cancelAnimationFrame(giftHoldFrame.current);
    setHoldProgress(100);
    setPhase("open");
    playFinaleCue(sound, "open");
    window.navigator.vibrate?.([45, 35, 90, 45, 130]);
  };

  const startGiftHold = (event) => {
    if (phase !== "gift" || openedRef.current) return;
    cancelAnimationFrame(giftHoldFrame.current);
    event.currentTarget.setPointerCapture(event.pointerId);
    romanticAudio.sfx("holdStart");
    giftHoldStart.current = performance.now() - holdProgressRef.current * 16;
    const tick = (now) => {
      const next = Math.min(100, (now - giftHoldStart.current) / 16);
      holdProgressRef.current = next;
      setHoldProgress(next);
      romanticAudio.progressTick(next);
      if (next >= 100) {
        openGift();
        return;
      }
      giftHoldFrame.current = requestAnimationFrame(tick);
    };
    giftHoldFrame.current = requestAnimationFrame(tick);
  };

  const stopGiftHold = () => {
    cancelAnimationFrame(giftHoldFrame.current);
  };

  const tapGift = () => {
    if (openedRef.current || phase !== "gift") return;
    const next = Math.min(100, holdProgressRef.current + 25);
    holdProgressRef.current = next;
    setHoldProgress(next);
    romanticAudio.sfx("heartTap", { progress: next });
    if (next >= 100) window.setTimeout(openGift, 0);
  };

  const backgroundAnimation = phase === "journey"
    ? { scale: 1, filter: "brightness(1) saturate(1)" }
    : phase === "reveal"
      ? { scale: 1.04, filter: "brightness(0.94) saturate(1.08)" }
      : { scale: 1.13, filter: "brightness(0.62) saturate(1.16)" };

  return (
    <motion.section className={`screen finale-screen finale-phase-${phase}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.img
        className="finale-bg finale-cinematic-bg"
        src="/assets/gift-finale-bg.jpg"
        alt="선물 상자가 놓인 반짝이는 추억 행성"
        animate={backgroundAnimation}
        transition={{ duration: 1.1, ease: [0.2, 0.72, 0.2, 1] }}
      />
      <div className="screen-shade finale-shade" />
      <SoundButton enabled={sound} onToggle={onToggleSound} />

      <AnimatePresence mode="wait">
        {phase === "journey" && (
          <motion.div className="final-mission" key="mission" exit={{ opacity: 0, scale: 1.25, y: -40 }} transition={{ duration: 0.45 }}>
            <span className="eyebrow">FINAL MISSION</span>
            <h2>총총이 별을<br />꽁알이에게 보내줘</h2>
            <p>어려운 문제는 없어. 보고 싶은 마음만 오른쪽으로 살며시 밀어줘.</p>
            <div
              className="final-journey"
              onPointerDown={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                journeyDrag.current = { active: true, left: rect.left, width: rect.width };
                event.currentTarget.setPointerCapture(event.pointerId);
                romanticAudio.sfx("dragStart");
              }}
              onPointerMove={(event) => {
                if (!journeyDrag.current.active || phase !== "journey") return;
                const travel = journeyDrag.current.width - 56;
                const offset = Math.min(travel, Math.max(0, event.clientX - journeyDrag.current.left - 28));
                const next = (offset / travel) * 100;
                setJourneyProgress(next);
                romanticAudio.progressTick(next);
              }}
              onPointerUp={(event) => {
                const travel = journeyDrag.current.width - 56;
                const offset = Math.min(travel, Math.max(0, event.clientX - journeyDrag.current.left - 28));
                journeyDrag.current.active = false;
                if (offset / travel > 0.72) arrive();
                else {
                  setJourneyProgress(0);
                  romanticAudio.sfx("dragReset");
                }
              }}
              onPointerCancel={() => {
                journeyDrag.current.active = false;
                setJourneyProgress(0);
                romanticAudio.sfx("dragReset");
              }}
            >
              <span className="journey-label sender">총총이</span>
              <span className="journey-label receiver">꽁알이</span>
              <Heart className="journey-heart" size={34} weight="fill" />
              <button className="final-rocket" style={{ transform: `translateX(${journeyProgress * 2.38}px)` }} aria-label="총총이 별을 꽁알이에게 보내기">
                <RocketLaunch size={34} weight="fill" />
              </button>
            </div>
            <span className="drag-hint">오른쪽으로 드래그</span>
          </motion.div>
        )}

        {phase === "convergence" && (
          <motion.div className="final-cinematic-stage" key="convergence" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.72 }}>
            <div className="final-cinematic-copy">
              <span className="eyebrow">MEMORY CONVERGENCE</span>
              <h2>10개의 추억이<br />하나로 모이는 중</h2>
              <p>꽁알이와 총총이의 반짝였던 날들이 마지막 선물을 깨우고 있어.</p>
            </div>
            <FinaleMemoryOrbit />
            <motion.img
              className="final-convergence-gift"
              src="/assets/finale/gift-closed.webp"
              alt=""
              initial={{ opacity: 0, scale: 0.35, rotateY: -70 }}
              animate={{ opacity: 1, scale: [0.35, 0.82, 0.72], rotateY: 360 }}
              transition={{ duration: 2.25, ease: [0.18, 0.78, 0.2, 1] }}
            />
            <motion.span className="final-cinematic-status" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.8 }}>
              <Sparkle size={15} weight="fill" /> 추억별 동기화 중
            </motion.span>
          </motion.div>
        )}

        {phase === "gift" && (
          <motion.div className="final-gift-stage" key="gift-hold" initial={{ opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.28 }} transition={{ type: "spring", stiffness: 120, damping: 15 }}>
            <div className="final-cinematic-copy gift-stage-copy">
              <span className="eyebrow">ONE LAST TOUCH</span>
              <h2>꽁알이의 손으로<br />마지막 선물을 열어줘</h2>
              <p>선물상자를 꾹 누르면 우리 100일 우주의 마지막 문이 열려.</p>
            </div>
            <button
              className="gift-hold-button"
              onPointerDown={startGiftHold}
              onPointerUp={stopGiftHold}
              onPointerCancel={stopGiftHold}
              onClick={tapGift}
              aria-label="선물상자를 길게 눌러 열기"
              style={{ transform: `perspective(800px) rotateY(${holdProgress * 0.06}deg) scale(${1 + holdProgress * 0.0012})` }}
            >
              <img src="/assets/finale/gift-closed.webp" alt="하트 보석이 달린 닫힌 선물상자" draggable="false" />
            </button>
            <div className="gift-hold-meter" aria-label={`선물 개봉 에너지 ${Math.round(holdProgress)}%`}>
              <span style={{ width: `${holdProgress}%` }} />
            </div>
            <span className="gift-hold-hint"><Heart size={14} weight="fill" /> {holdProgress > 0 ? `두근 에너지 ${Math.round(holdProgress)}%` : "1.5초 동안 꾹 누르기 · 톡톡 4번도 가능"}</span>
          </motion.div>
        )}

        {phase === "open" && (
          <motion.div className="final-open-stage" key="gift-open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.16 }}>
            <FinaleBurst />
            <motion.img
              className="final-open-gift"
              src="/assets/finale/gift-open.webp"
              alt="빛나는 하트가 떠오른 열린 선물상자"
              initial={{ scale: 0.42, opacity: 0, rotateX: 42 }}
              animate={{ scale: [0.42, 1.14, 0.96], opacity: 1, rotateX: 0, y: [30, -8, 0] }}
              transition={{ duration: 1.45, ease: [0.16, 0.78, 0.22, 1] }}
            />
            <motion.div className="final-open-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}>
              <span className="eyebrow">100 DAYS · ONE UNIVERSE</span>
              <h2>우리의 100일 우주<br />완성!</h2>
            </motion.div>
          </motion.div>
        )}

        {phase === "reveal" && (
          <motion.div className="gift-reveal" key="gift-reveal" initial={{ opacity: 0, scale: 0.84 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
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

  useEffect(() => {
    romanticAudio.setEnabled(sound);
  }, [sound]);

  const toggleSound = () => {
    setSound((current) => {
      const next = !current;
      romanticAudio.setEnabled(next);
      if (next) window.setTimeout(() => romanticAudio.sfx("toggleOn"), 55);
      return next;
    });
  };

  const goTo = (nextScreen, cue = "transition") => {
    romanticAudio.unlock();
    romanticAudio.sfx(cue);
    setScreen(nextScreen);
  };

  const startJourney = () => {
    romanticAudio.unlock();
    romanticAudio.sfx("launch");
    setScreen("map");
  };

  const completeChapter = () => {
    const nextCompleted = Math.max(completed, active + 1);
    setCompleted(nextCompleted);
    localStorage.setItem(STORAGE_KEY, String(nextCompleted));
    if (active === chapters.length - 1) {
      goTo("finale", "finaleArrival");
      return;
    }
    setActive(Math.min(chapters.length - 1, active + 1));
    goTo("map", "launch");
  };

  return (
    <main
      className="mobile-prototype"
      aria-live="polite"
      onPointerDownCapture={(event) => {
        romanticAudio.unlock();
        if (event.target.closest?.("button:not(:disabled)")) romanticAudio.sfx("press");
      }}
    >
      <AnimatePresence mode="wait">
        {screen === "intro" && (
          <IntroScreen key="intro" sound={sound} onToggleSound={toggleSound} onStart={startJourney} />
        )}
        {screen === "map" && (
          <MapScreen
            key="map"
            completed={completed}
            active={active}
            setActive={setActive}
            sound={sound}
            onToggleSound={toggleSound}
            onOpen={() => goTo("album", "launch")}
            onFinale={() => goTo("finale", "finaleArrival")}
          />
        )}
        {screen === "album" && (
          <AlbumScreen key={`album-${active}`} chapter={chapter} sound={sound} onToggleSound={toggleSound} onBack={() => goTo("map", "back")} onMission={() => goTo("mission", "missionStart")} />
        )}
        {screen === "mission" && (
          <MissionScreen key={`mission-${active}`} chapter={chapter} sound={sound} onToggleSound={toggleSound} onBack={() => goTo("album", "back")} onComplete={completeChapter} />
        )}
        {screen === "finale" && (
          <FinaleScreen key="finale" sound={sound} onToggleSound={toggleSound} onBackToMap={() => { setActive(chapters.length - 1); goTo("map", "back"); }} />
        )}
      </AnimatePresence>
    </main>
  );
}
