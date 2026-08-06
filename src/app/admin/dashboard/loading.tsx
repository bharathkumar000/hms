export default function DashboardLoading() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ width: '30%', height: '40px', backgroundColor: '#e2e8f0', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
      <div style={{ width: '20%', height: '20px', backgroundColor: '#e2e8f0', borderRadius: '8px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', marginTop: '-1rem' }}></div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: '120px', backgroundColor: '#e2e8f0', borderRadius: '12px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ height: '200px', backgroundColor: '#e2e8f0', borderRadius: '12px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
        <div style={{ height: '200px', backgroundColor: '#e2e8f0', borderRadius: '12px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}
