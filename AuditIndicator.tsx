interface AuditIndicatorProps {
  audit: { final: string; maxErr: number } | null;
}

export default function AuditIndicator({ audit }: AuditIndicatorProps) {
  if (!audit) return null;

  const cfg: Record<string, { bg: string; text: string; border: string }> = {
    VERIFIED: { bg: 'rgba(0,100,40,0.5)', text: '#00ff66', border: 'rgba(0,255,102,0.5)' },
    CONDITIONAL: { bg: 'rgba(120,80,0,0.5)', text: '#ffcc00', border: 'rgba(255,200,0,0.5)' },
    REJECTED: { bg: 'rgba(100,0,0,0.5)', text: '#ff4444', border: 'rgba(255,50,50,0.5)' }
  };

  const c = cfg[audit.final] || { bg: 'rgba(20,30,20,0.5)', text: '#88ffbb', border: 'rgba(0,255,102,0.2)' };

  return (
    <div className="absolute top-16 right-[310px] px-3 py-2 text-[10px] font-bold pointer-events-auto tracking-wider font-mono"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, zIndex: 10 }}>
      <div>{audit.final}</div>
      <div className="text-[9px] mt-1 opacity-70">Err max: {audit.maxErr.toFixed(3)} mils</div>
    </div>
  );
}
