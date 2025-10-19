interface MixerTruckProps {
  x: number;
  y: number;
  isReceiving?: boolean;
  isMoving?: boolean;
}

export const MixerTruck = ({ x, y, isReceiving = false, isMoving = false }: MixerTruckProps) => {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Truck Chassis */}
      <rect x="0" y="40" width="100" height="8" fill="#34495e" stroke="#2c3e50" strokeWidth="2" />
      
      {/* Wheels */}
      <g>
        {/* Front Wheel */}
        <circle cx="20" cy="52" r="8" fill="#2c3e50" stroke="#1a252f" strokeWidth="2" />
        <circle cx="20" cy="52" r="4" fill="#7f8c8d" />
        
        {/* Rear Wheel 1 */}
        <circle cx="70" cy="52" r="8" fill="#2c3e50" stroke="#1a252f" strokeWidth="2" />
        <circle cx="70" cy="52" r="4" fill="#7f8c8d" />
        
        {/* Rear Wheel 2 */}
        <circle cx="85" cy="52" r="8" fill="#2c3e50" stroke="#1a252f" strokeWidth="2" />
        <circle cx="85" cy="52" r="4" fill="#7f8c8d" />
      </g>
      
      {/* Truck Cab */}
      <g>
        <rect x="5" y="20" width="30" height="20" fill="#2c3e50" stroke="#1a252f" strokeWidth="2" rx="2" />
        {/* Windshield */}
        <path d="M 10 20 L 15 25 L 30 25 L 32 20 Z" fill="#4a90e2" opacity="0.6" stroke="#2c3e50" strokeWidth="1" />
        {/* Side Window */}
        <rect x="8" y="28" width="8" height="8" fill="#4a90e2" opacity="0.6" stroke="#2c3e50" strokeWidth="1" rx="1" />
      </g>
      
      {/* Drum Support Frame */}
      <g>
        <rect x="35" y="35" width="5" height="10" fill="#7f8c8d" stroke="#5a6c7d" strokeWidth="1" />
        <rect x="75" y="35" width="5" height="10" fill="#7f8c8d" stroke="#5a6c7d" strokeWidth="1" />
        <path d="M 40 38 L 75 38" stroke="#5a6c7d" strokeWidth="2" />
      </g>
      
      {/* Rotating Drum */}
      <g className={isReceiving ? "animate-spin-slow origin-center" : ""} style={{ transformOrigin: '57.5px 22px' }}>
        {/* Main Drum Body - Ellipse for 3D effect */}
        <ellipse cx="57.5" cy="22" rx="25" ry="18" fill="#95a5a6" stroke="#7f8c8d" strokeWidth="2" />
        
        {/* Drum Stripes for rotation effect */}
        <g opacity="0.7">
          <ellipse cx="57.5" cy="22" rx="25" ry="18" fill="none" stroke="#7f8c8d" strokeWidth="3" strokeDasharray="8,8" />
          <line x1="40" y1="10" x2="40" y2="34" stroke="#7f8c8d" strokeWidth="2" />
          <line x1="50" y1="8" x2="50" y2="36" stroke="#7f8c8d" strokeWidth="2" />
          <line x1="65" y1="8" x2="65" y2="36" stroke="#7f8c8d" strokeWidth="2" />
          <line x1="75" y1="10" x2="75" y2="34" stroke="#7f8c8d" strokeWidth="2" />
        </g>
        
        {/* Drum Front Cap */}
        <ellipse cx="57.5" cy="22" rx="6" ry="5" fill="#7f8c8d" stroke="#5a6c7d" strokeWidth="1" />
      </g>
      
      {/* Discharge Chute from Drum */}
      <g>
        <path d="M 57.5 40 L 57.5 50 L 50 55 L 65 55 L 57.5 50 Z" fill="#7f8c8d" stroke="#5a6c7d" strokeWidth="1" />
        {/* Chute opening indicator */}
        {isReceiving && (
          <g>
            <circle cx="57.5" cy="53" r="2" fill="#f39c12" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </g>
      
      {/* Concrete flow indicator */}
      {isReceiving && (
        <g opacity="0.6">
          <path d="M 55 55 Q 54 58 53 61" stroke="#95a5a6" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.8s" repeatCount="indefinite" />
          </path>
          <path d="M 60 55 Q 61 58 62 61" stroke="#95a5a6" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
          </path>
          <path d="M 57.5 55 Q 57.5 58 57.5 61" stroke="#95a5a6" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.8s" repeatCount="indefinite" begin="0.4s" />
          </path>
        </g>
      )}
    </g>
  );
};
