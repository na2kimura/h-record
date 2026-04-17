interface PainLocationDiagramProps {
  locations: string[];
}

export default function PainLocationDiagram({ locations }: PainLocationDiagramProps) {
  // Parse locations
  const frontLeft = locations.includes('頭前の左');
  const frontCenter = locations.includes('頭前の真ん中');
  const frontRight = locations.includes('頭前の右');
  
  const backLeft = locations.includes('頭後ろの左');
  const backCenter = locations.includes('頭後ろの真ん中');
  const backRight = locations.includes('頭後ろの右');
  
  const whole = locations.includes('全体');

  const activeColor = 'var(--color-danger)';
  const defaultFill = '#F0F0F0';
  const defaultStroke = '#CCCCCC';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 80 40" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      {/* --- FRONT HEAD --- */}
      <g transform="translate(10, 5)">
        <text x="15" y="-3" fontSize="8" fill="var(--color-text-muted)" textAnchor="middle">前</text>
        
        {/* Head outline */}
        <ellipse cx="15" cy="15" rx="14" ry="16" fill={defaultFill} stroke={defaultStroke} strokeWidth="1" />
        
        {/* Left segment (User's right side, viewer's left) */}
        {(frontLeft || whole) && (
          <path d="M 15 0 C 6 0 1 7 1 15 C 1 20 4 25 8 28 C 9 20 12 15 15 15 Z" fill={activeColor} />
        )}
        
        {/* Center segment */}
        {(frontCenter || whole) && (
          <path d="M 8 0 C 12 -1 18 -1 22 0 C 22 7 19 14 15 14 C 11 14 8 7 8 0 Z" fill={activeColor} />
        )}
        
        {/* Right segment */}
        {(frontRight || whole) && (
          <path d="M 15 0 C 24 0 29 7 29 15 C 29 20 26 25 22 28 C 21 20 18 15 15 15 Z" fill={activeColor} />
        )}
        
        {/* Eyes indicating direction (Front) */}
        <circle cx="10" cy="13" r="1.5" fill="#666" />
        <circle cx="20" cy="13" r="1.5" fill="#666" />
      </g>

      {/* --- BACK HEAD --- */}
      <g transform="translate(50, 5)">
        <text x="15" y="-3" fontSize="8" fill="var(--color-text-muted)" textAnchor="middle">後</text>
        
        {/* Head outline */}
        <circle cx="15" cy="15" r="14" fill={defaultFill} stroke={defaultStroke} strokeWidth="1" />
        
        {/* Back Left */}
        {(backLeft || whole) && (
          <path d="M 15 1 C 7 1 1 7 1 15 C 1 23 7 29 15 29 C 14 20 14 10 15 1 Z" fill={activeColor} />
        )}
        
        {/* Back Center */}
        {(backCenter || whole) && (
          <circle cx="15" cy="15" r="7" fill={activeColor} />
        )}
        
        {/* Back Right */}
        {(backRight || whole) && (
          <path d="M 15 1 C 23 1 29 7 29 15 C 29 23 23 29 15 29 C 16 20 16 10 15 1 Z" fill={activeColor} />
        )}
      </g>
    </svg>
  );
}
