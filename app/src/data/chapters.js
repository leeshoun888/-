import photos from "./photos.generated.json";

const chapterMeta = [
  {
    title: "웃음이 시작된 행성",
    eyebrow: "처음의 설렘",
    note: "마주 보기만 해도 웃음이 났던 우리 이야기",
    mission: { type: "tap", title: "웃음별 모으기", instruction: "반짝이는 하트를 톡톡 눌러 웃음별을 모아주세요." },
  },
  {
    title: "봄밤 산책 행성",
    eyebrow: "조금 더 가까이",
    note: "평범한 하루까지 특별해지기 시작한 시간",
    mission: { type: "swipe", title: "별가루 닦기", instruction: "화면을 살살 문질러 봄밤의 별빛을 밝혀주세요." },
  },
  {
    title: "고백이 도착한 행성",
    eyebrow: "우리의 시작",
    note: "두 사람의 마음이 같은 곳에 도착한 순간",
    mission: { type: "hold", title: "고백 신호 보내기", instruction: "하트를 꼭 눌러 총총이의 마음을 전해주세요." },
  },
  {
    title: "맛있는 우주 행성",
    eyebrow: "냠냠 대모험",
    note: "함께 먹으면 뭐든 더 맛있었던 날들",
    mission: { type: "drag", title: "데이트 우주선 출발", instruction: "우주선을 오른쪽 별까지 데려다주세요." },
  },
  {
    title: "우리다운 하루 행성",
    eyebrow: "까르르 일상",
    note: "사진만 봐도 웃음소리가 들리는 것 같은 시간",
    mission: { type: "tap", title: "두근두근 충전", instruction: "하트를 톡톡 눌러 설렘 에너지를 채워주세요." },
  },
  {
    title: "꽃과 반짝임 행성",
    eyebrow: "예쁜 마음",
    note: "꽃보다 더 환하게 웃던 꽁알이의 순간",
    mission: { type: "swipe", title: "꽃별 피우기", instruction: "손가락으로 별밭을 쓰다듬어 꽃별을 피워주세요." },
  },
  {
    title: "자꾸 보고 싶은 행성",
    eyebrow: "연속 데이트",
    note: "헤어지고 나면 바로 다음 만남을 기다리던 시간",
    mission: { type: "hold", title: "손 꼭 잡기", instruction: "하트를 놓지 말고 꼭 눌러 우리 시간을 지켜주세요." },
  },
  {
    title: "마음이 깊어진 행성",
    eyebrow: "한 뼘 더 가까이",
    note: "소소한 만남도 오래 기억하고 싶은 날들",
    mission: { type: "drag", title: "추억별 만나기", instruction: "총총이 별을 꽁알이 별 가까이 보내주세요." },
  },
  {
    title: "다시 만난 설렘 행성",
    eyebrow: "보고 싶었어",
    note: "기다림 끝에 다시 반짝이던 우리",
    mission: { type: "tap", title: "심쿵별 깨우기", instruction: "잠든 심쿵별을 톡톡 깨워주세요." },
  },
  {
    title: "꽁알이와 총총이 행성",
    eyebrow: "100일의 우리",
    note: "지금까지의 모든 순간이 모여 만든 작은 우주",
    mission: { type: "swipe", title: "마지막 별빛 모으기", instruction: "우리 사진 위의 별빛을 모아 마지막 문을 열어주세요." },
  },
];

const grouped = photos.reduce((result, photo) => {
  (result[photo.date] ??= []).push(photo);
  return result;
}, {});
const dates = Object.keys(grouped).sort();

export const chapters = chapterMeta.map((meta, index) => {
  const chapterDates = dates.slice(index * 3, index * 3 + 3);
  const chapterPhotos = chapterDates.flatMap((date) => grouped[date]);

  return {
    id: `chapter-${index + 1}`,
    number: index + 1,
    ...meta,
    dates: chapterDates,
    photos: chapterPhotos,
    cover: chapterPhotos[0],
    firstDateStory:
      index === 0
        ? "무르무르와 정문 쪽 카페에서 같이 밥을 먹고 서로의 감정을 확인했던 날. 서로 바라보면서 웃음이 끊이지 않았고, 설레면서도 긴장됐던 우리의 첫 데이트."
        : null,
  };
});

export const totalPhotos = photos.length;
