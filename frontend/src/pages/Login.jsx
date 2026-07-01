import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try { await login(form.email, form.password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.icon}>🚗</div>
        <h2 style={S.title}>SmartCommute</h2>
        <p style={S.sub}>Employee Ride Sharing Platform</p>
        {error && <div style={S.err}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input style={S.inp} type="email"    placeholder="Company Email"
            value={form.email}    onChange={e => setForm({...form, email: e.target.value})}    required />
          <input style={S.inp} type="password" placeholder="Password"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button style={S.btn} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={S.link}>No account? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
}

const S = {
  page:  { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#EEF2FF' },
  card:  { background:'white', padding:'40px', borderRadius:'16px', boxShadow:'0 8px 32px rgba(79,70,229,0.12)', width:'100%', maxWidth:'400px' },
  icon:  { fontSize:'48px', textAlign:'center', marginBottom:'8px' },
  title: { textAlign:'center', fontSize:'26px', fontWeight:'700', color:'#1E1B4B', margin:'0 0 4px' },
  sub:   { textAlign:'center', color:'#6B7280', fontSize:'14px', marginBottom:'24px' },
  err:   { background:'#FEE2E2', color:'#DC2626', padding:'10px 14px', borderRadius:'8px', marginBottom:'16px', fontSize:'13px' },
  inp:   { width:'100%', padding:'12px 14px', marginBottom:'12px', border:'1.5px solid #E5E7EB', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box' },
  btn:   { width:'100%', padding:'13px', background:'#4F46E5', color:'white', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:'600', cursor:'pointer', marginTop:'4px' },
  link:  { textAlign:'center', marginTop:'20px', fontSize:'14px', color:'#6B7280' }
};
