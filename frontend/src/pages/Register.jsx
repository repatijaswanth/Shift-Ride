import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form,    setForm]    = useState({ name:'', email:'', password:'', phone:'', companyName:'', vehicleType:'car' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { register }          = useAuth();
  const navigate              = useNavigate();

  const ch = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try { await register(form); alert('Registration successful! Please login.'); navigate('/login'); }
    catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.icon}>🚗</div>
        <h2 style={S.title}>Create Account</h2>
        <p style={S.sub}>Join SmartCommute today</p>
        {error && <div style={S.err}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {[['name','text','Full Name'],['email','email','Company Email'],
            ['password','password','Password'],['phone','tel','Phone Number'],
            ['companyName','text','Company Name']].map(([n,t,p]) => (
            <input key={n} style={S.inp} name={n} type={t} placeholder={p}
              value={form[n]} onChange={ch} required />
          ))}
          <select style={S.inp} name="vehicleType" value={form.vehicleType} onChange={ch}>
            <option value="car">🚗 Car (15 km/liter)</option>
            <option value="bike">🏍️ Bike (40 km/liter)</option>
          </select>
          <button style={S.btn} disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={S.link}>Already have account? <Link to="/login">Login here</Link></p>
      </div>
    </div>
  );
}

const S = {
  page:  { display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#EEF2FF' },
  card:  { background:'white', padding:'40px', borderRadius:'16px', boxShadow:'0 8px 32px rgba(79,70,229,0.12)', width:'100%', maxWidth:'420px' },
  icon:  { fontSize:'48px', textAlign:'center', marginBottom:'8px' },
  title: { textAlign:'center', fontSize:'26px', fontWeight:'700', color:'#1E1B4B', margin:'0 0 4px' },
  sub:   { textAlign:'center', color:'#6B7280', fontSize:'14px', marginBottom:'24px' },
  err:   { background:'#FEE2E2', color:'#DC2626', padding:'10px 14px', borderRadius:'8px', marginBottom:'16px', fontSize:'13px' },
  inp:   { width:'100%', padding:'12px 14px', marginBottom:'12px', border:'1.5px solid #E5E7EB', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box' },
  btn:   { width:'100%', padding:'13px', background:'#4F46E5', color:'white', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:'600', cursor:'pointer', marginTop:'4px' },
  link:  { textAlign:'center', marginTop:'20px', fontSize:'14px', color:'#6B7280' }
};
