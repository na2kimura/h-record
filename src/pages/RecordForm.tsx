import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  WEATHER_OPTIONS, ACTION_OPTIONS, OTHER_SYMPTOMS 
} from '../types';

const getWeatherStringFromCode = (code: number) => {
  if (code === 0 || code === 1) return '晴れ';
  if (code === 2 || code === 3) return '曇り';
  if (code === 45 || code === 48) return '霧';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '雨';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '雪';
  if (code >= 95 && code <= 99) return '雷雨';
  return 'その他';
};

export default function RecordForm() {
  const { id } = useParams(); // If id is present, we are in Edit mode
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [weather, setWeather] = useState('晴れ');
  const [action, setAction] = useState<string[]>([]);
  const [actionOther, setActionOther] = useState('');
  const [painLevel, setPainLevel] = useState<number | null>(null);
  const [painLocations, setPainLocations] = useState<string[]>([]);
  const [otherSymptoms, setOtherSymptoms] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      // Edit mode: fetch existing record
      const fetchRecord = async () => {
        try {
          const docRef = doc(db, 'records', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Ensure record belongs to user
            if (data.userId !== currentUser?.uid) {
              navigate('/');
              return;
            }
            setDate(data.date);
            setTime(data.time);
            setWeather(data.weather);
            setAction(Array.isArray(data.action) ? data.action : (data.action ? [data.action] : []));
            setActionOther(data.actionOther || '');
            setPainLevel(data.painLevel);
            setPainLocations(data.painLocations || []);
            setOtherSymptoms(data.otherSymptoms || []);
            setMemo(data.memo || '');
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Error fetching record:', error);
        } finally {
          setInitialFetchLoading(false);
        }
      };
      fetchRecord();
    } else {
      // New mode: Set default time and fetch weather
      const now = new Date();
      // Adjust to local time strings
      const localDate = now.toLocaleDateString('sv-SE'); // YYYY-MM-DD
      const localTime = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }); // HH:MM
      
      setDate(localDate);
      setTime(localTime);

      const fetchWeather = async () => {
        try {
          // 福井市の緯度経度
          const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=36.0641&longitude=136.2219&current_weather=true');
          const data = await res.json();
          if (data && data.current_weather) {
            const weatherStr = getWeatherStringFromCode(data.current_weather.weathercode);
            setWeather(weatherStr);
          }
        } catch (error) {
          console.error("Failed to fetch weather", error);
        }
      };
      fetchWeather();
    }
  }, [id, navigate, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (action.length === 0 || !painLevel || !currentUser) {
      alert('行動と痛みのレベルは必須です。');
      return;
    }

    setLoading(true);
    try {
      const recordData = {
        userId: currentUser.uid,
        date,
        time,
        weather,
        action,
        actionOther: action.includes('その他自由記入') ? actionOther : '',
        painLevel,
        painLocations,
        otherSymptoms,
        memo,
        updatedAt: Date.now()
      };

      if (id) {
        // Update
        const docRef = doc(db, 'records', id);
        await updateDoc(docRef, recordData);
      } else {
        // Create
        await addDoc(collection(db, 'records'), {
          ...recordData,
          createdAt: Date.now()
        });
      }
      navigate('/');
    } catch (error) {
      console.error('Error saving record:', error);
      alert('保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, array: string[], item: string) => {
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  if (initialFetchLoading) {
    return <div className="container text-center"><p>読み込み中...</p></div>;
  }

  return (
    <div className="container">
      <div className="header-bar">
        <h2>{id ? '記録の編集' : '新しい記録'}</h2>
        <button type="button" className="btn" onClick={() => navigate('/')}>戻る</button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">日付</label>
              <input 
                type="date" 
                className="form-control" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label">時間</label>
              <input 
                type="time" 
                className="form-control" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">天気 (福井市)</label>
            <select className="form-control" value={weather} onChange={e => setWeather(e.target.value)}>
              {WEATHER_OPTIONS.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">行動 (複数選択可) <span style={{color: 'var(--color-danger)'}}>*</span></label>
            <div className="pill-group">
              {ACTION_OPTIONS.map(opt => (
                <label key={opt} className={`pill-label ${action.includes(opt) ? 'active' : ''}`}>
                  <input 
                    type="checkbox" 
                    name="action" 
                    value={opt} 
                    checked={action.includes(opt)} 
                    onChange={() => toggleArrayItem(setAction, action, opt)} 
                  />
                  {opt}
                </label>
              ))}
            </div>
            {action.includes('その他自由記入') && (
              <input 
                type="text" 
                className="form-control" 
                style={{ marginTop: '10px' }} 
                placeholder="行動を入力..." 
                value={actionOther} 
                onChange={e => setActionOther(e.target.value)} 
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">痛みのレベル (1〜5) <span style={{color: 'var(--color-danger)'}}>*</span></label>
            <div className="number-btn-group">
              {[1, 2, 3, 4, 5].map(num => (
                <button 
                  key={num} 
                  type="button"
                  className={`number-btn pain-${num} ${painLevel === num ? 'active' : ''}`}
                  onClick={() => setPainLevel(num)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">痛い部位 (複数選択可)</label>
            <div className="head-map-container">
              
              <div className="head-section">
                <div className="head-label">前（おでこ・顔側）</div>
                <div className="head-buttons">
                  {['頭前の左', '頭前の真ん中', '頭前の右'].map(loc => (
                    <label key={loc} className={`pill-label ${painLocations.includes(loc) ? 'active' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={painLocations.includes(loc)}
                        onChange={() => toggleArrayItem(setPainLocations, painLocations, loc)}
                      />
                      {loc.replace('頭前の', '')}
                    </label>
                  ))}
                </div>
              </div>

              <div className="head-section">
                <div className="head-label">後ろ（後頭部側）</div>
                <div className="head-buttons">
                  {['頭後ろの左', '頭後ろの真ん中', '頭後ろの右'].map(loc => (
                    <label key={loc} className={`pill-label ${painLocations.includes(loc) ? 'active' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={painLocations.includes(loc)}
                        onChange={() => toggleArrayItem(setPainLocations, painLocations, loc)}
                      />
                      {loc.replace('頭後ろの', '')}
                    </label>
                  ))}
                </div>
              </div>

              <label className={`pill-label head-full-btn ${painLocations.includes('全体') ? 'active' : ''}`}>
                <input 
                  type="checkbox" 
                  checked={painLocations.includes('全体')}
                  onChange={() => toggleArrayItem(setPainLocations, painLocations, '全体')}
                />
                頭全体
              </label>

            </div>
          </div>

          <div className="form-group">
            <label className="form-label">その他体調 (複数選択可)</label>
            <div className="pill-group">
              {OTHER_SYMPTOMS.map(sym => (
                <label key={sym} className={`pill-label ${otherSymptoms.includes(sym) ? 'active' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={otherSymptoms.includes(sym)}
                    onChange={() => toggleArrayItem(setOtherSymptoms, otherSymptoms, sym)}
                  />
                  {sym}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">メモ</label>
            <textarea 
              className="form-control" 
              placeholder="気になったことなどを自由に記入してください..."
              value={memo}
              onChange={e => setMemo(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', fontSize: '18px', padding: '16px' }}
            disabled={loading}
          >
            {loading ? '保存中...' : '記録を保存する'}
          </button>
        </form>
      </div>
    </div>
  );
}
