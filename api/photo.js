import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
  // ------------------------------------------------------------------
  // [수정 및 확인] CORS 설정
  // ------------------------------------------------------------------
  // 요청을 허용할 주소 목록입니다. 여기에 꼭 내 컴퓨터 주소가 포함되어야 합니다.
  const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    // 'https://내-프론트엔드-주소.vercel.app' // << 나중에 프론트엔드를 배포하면 그 주소도 추가해야 합니다.
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  // OPTIONS 메소드 사전 요청(Preflight) 처리
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }
  // ------------------------------------------------------------------

  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const placeName = req.query.placeName;

  if (!placeName) {
    return res.status(400).json({ error: "장소 이름이 필요합니다." });
  }

  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      placeName
    )}&inputtype=textquery&fields=photos&key=${GOOGLE_API_KEY}`;
    const searchResponse = await axios.get(searchUrl);
    const photos = searchResponse.data.candidates[0]?.photos;

    if (!photos || photos.length === 0) {
      return res.status(200).json({ imageUrl: null });
    }

    const photoReference = photos[0].photo_reference;
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;

    res.status(200).json({ imageUrl: photoUrl });
  } catch (error) {
    console.error(
      "Google API Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "사진 정보를 가져오는 데 실패했습니다." });
  }
}
