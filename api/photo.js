// Google Places API와 통신하기 위해 'axios' 라이브러리를 사용합니다.
// 프로젝트에 axios가 설치되어 있어야 합니다. (터미널에서 npm install axios 실행)
import axios from "axios";

// Vercel 서버리스 함수의 표준 형식입니다.
// 이 함수가 '/api/photo' 주소로 요청이 올 때마다 실행됩니다.
export default async function handler(req, res) {
  // ------------------------------------------------------------------
  // CORS 설정 (프론트엔드와 백엔드 주소가 다를 때 필수)
  // ------------------------------------------------------------------
  // 여기에 허용할 프론트엔드 주소 목록을 추가하세요.
  const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    // 'https://내-프론트엔드-주소.vercel.app' // << 나중에 프론트엔드 배포 후 주소 추가
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    // 허용된 주소에서 온 요청일 경우, 응답 헤더에 허용 설정을 추가합니다.
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // 브라우저가 본 요청을 보내기 전에 보내는 '사전 요청(Preflight)'을 처리합니다.
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }
  // ------------------------------------------------------------------

  // Vercel 대시보드에 등록한 환경 변수(API 키)를 안전하게 불러옵니다.
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

  // 프론트엔드에서 fetch 요청 시 보낸 장소 이름을 가져옵니다. (예: /api/photo?placeName=스타벅스)
  const placeName = req.query.placeName;

  // 장소 이름이 없으면 에러 메시지를 보냅니다.
  if (!placeName) {
    return res.status(400).json({ error: "장소 이름이 필요합니다." });
  }

  try {
    // 1. 장소 이름으로 Google Places API를 검색해 사진 정보를 얻어옵니다.
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      placeName
    )}&inputtype=textquery&fields=photos&key=${GOOGLE_API_KEY}`;
    const searchResponse = await axios.get(searchUrl);

    const photos = searchResponse.data.candidates[0]?.photos;

    // 검색 결과에 사진이 없으면, 사진이 없다는 정보를 정상적으로 전달합니다.
    if (!photos || photos.length === 0) {
      return res.status(200).json({ imageUrl: null });
    }

    // 사진 정보(photo_reference)를 추출합니다.
    const photoReference = photos[0].photo_reference;

    // 2. 사진 정보를 이용해 실제 이미지에 접근할 수 있는 최종 URL을 만듭니다.
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;

    // 3. 완성된 사진 URL을 프론트엔드로 보냅니다.
    res.status(200).json({ imageUrl: photoUrl });
  } catch (error) {
    // 중간에 에러가 발생하면 서버 로그에 기록하고, 프론트엔드에 에러 메시지를 보냅니다.
    console.error(
      "Google API Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "사진 정보를 가져오는 데 실패했습니다." });
  }
}
