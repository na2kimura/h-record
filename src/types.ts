export interface HeadacheRecord {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  weather: string;
  action: string[];
  actionOther?: string;
  painLevel: number; // 1-5
  painLocations: string[];
  otherSymptoms: string[];
  memo: string;
  createdAt: number;
}

export const WEATHER_OPTIONS = ['晴れ', '曇り', '雨', '雪', '雷雨', '霧', 'その他'];

export const ACTION_OPTIONS = ['起きる', '食べる', '横になる', '座る', '立つ', '歩く', 'その他自由記入'];

export const PAIN_LOCATIONS = ['頭前の右', '頭前の真ん中', '頭前の左', '頭後ろの右', '頭後ろの真ん中', '頭後ろの左', '全体'];

export const OTHER_SYMPTOMS = ['腹痛', '吐き気', '眩暈', '動悸', '生理'];
