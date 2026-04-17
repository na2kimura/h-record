import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { HeadacheRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WeatherIcon from '../components/WeatherIcon';
import PainLocationDiagram from '../components/PainLocationDiagram';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<HeadacheRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state (e.g., '2026-04')
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const prevPrevMonthDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const prevPrevMonthStr = `${prevPrevMonthDate.getFullYear()}-${String(prevPrevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const fetchRecords = async (monthPrefix: string) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'records'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedRecords: HeadacheRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedRecords.push({ id: doc.id, ...(doc.data() as HeadacheRecord) });
      });

      // Filter by month
      const filteredRecords = fetchedRecords.filter(r => r.date && r.date.startsWith(monthPrefix));
      
      // Sort desc by date, then time
      filteredRecords.sort((a, b) => {
        const dateTimeA = `${a.date} ${a.time}`;
        const dateTimeB = `${b.date} ${b.time}`;
        return dateTimeB.localeCompare(dateTimeA);
      });
      
      setRecords(filteredRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(selectedMonth);
  }, [selectedMonth, currentUser]);

  const chartData = [...records].reverse().map(r => ({
    timeLabel: `${r.date.slice(8,10)}日 ${r.time}`,
    painLevel: r.painLevel
  }));

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container">
      <div className="header-bar" style={{ marginBottom: '16px' }}>
        <h2>H-Record</h2>
        <div>
          <button className="btn no-print" onClick={() => window.print()} style={{ padding: '6px 12px', fontSize: '14px', marginRight: '8px' }}>印刷</button>
          <button className="btn no-print" onClick={handleLogout} style={{ padding: '6px 12px', fontSize: '14px' }}>ログアウト</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <select 
          className="form-control" 
          style={{ width: 'auto', padding: '8px 12px' }} 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value={currentMonthStr}>今月の記録 ({currentMonthStr})</option>
          <option value={prevMonthStr}>先月の記録 ({prevMonthStr})</option>
          <option value={prevPrevMonthStr}>先々月の記録 ({prevPrevMonthStr})</option>
        </select>
        
        <button 
          className="btn btn-primary no-print" 
          onClick={() => navigate('/record/new')}
        >
          + 新規記録
        </button>
      </div>

      {records.length > 0 && !loading && (
        <div className="card no-print" style={{ marginBottom: '24px', padding: '16px 0 16px 0' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '16px', marginLeft: '20px', color: 'var(--color-text-muted)' }}>痛みの推移</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickMargin={10} minTickGap={20} />
                <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="painLevel" stroke="var(--color-danger)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-danger)' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-muted"><p>読み込み中...</p></div>
      ) : records.length === 0 ? (
        <div className="card text-center text-muted">
          <p>選択した月の記録はありません。</p>
        </div>
      ) : (
        <div>
          {records.map((record) => (
            <div 
              key={record.id} 
              className={`card`}
              style={{
                cursor: 'pointer',
                backgroundColor: `var(--color-pain-${record.painLevel || 1})`,
                transition: 'transform 0.1s ease',
              }}
              onClick={() => navigate(`/record/${record.id}`)}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--color-text-main)', fontSize: '14px' }}>
                  {record.date} {record.time}
                </span>
                <span style={{ 
                  backgroundColor: '#FFF', 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '13px', 
                  fontWeight: 'bold',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-main)'
                }}>
                  痛み: {record.painLevel}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  天気: <WeatherIcon weather={record.weather} size={14} />
                </span> 
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  部位: {record.painLocations?.length > 0 ? <PainLocationDiagram locations={record.painLocations || []} /> : 'なし'}
                </span>
                {record.painTypes && record.painTypes.length > 0 && (
                  <span>種類: {record.painTypes.join(', ')}</span>
                )}
                {record.duration && (
                  <span>時間: {record.duration}</span>
                )}
              </div>
              <div style={{ fontSize: '15px' }}>
                行動: {
                  Array.isArray(record.action) 
                    ? record.action.join(', ') + (record.action.includes('その他自由記入') && record.actionOther ? ` (${record.actionOther})` : '')
                    : record.action + (record.action === 'その他自由記入' && record.actionOther ? ` (${record.actionOther})` : '')
                }
              </div>
            </div>
          ))}
          
          <table className="print-only print-table">
            <thead>
              <tr>
                <th>日時</th>
                <th>痛み</th>
                <th>種類</th>
                <th>時間</th>
                <th>部位</th>
                <th>体調</th>
                <th>行動</th>
                <th>天気</th>
                <th>メモ</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{r.date.slice(5)}<br/>{r.time}</td>
                  <td>{r.painLevel}</td>
                  <td>{r.painTypes?.join(', ')}</td>
                  <td>{r.duration}</td>
                  <td>
                    {r.painLocations?.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <PainLocationDiagram locations={r.painLocations || []} />
                      </div>
                    ) : ''}
                  </td>
                  <td>{r.otherSymptoms?.join(', ')}</td>
                  <td>
                    {Array.isArray(r.action) ? r.action.join(', ') : r.action}
                    {r.actionOther ? ` (${r.actionOther})` : ''}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <WeatherIcon weather={r.weather} size={12} /> {r.weather}
                    </div>
                  </td>
                  <td>{r.memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
