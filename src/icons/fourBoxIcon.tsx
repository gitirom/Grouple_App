interface FourBoxIconProps {
    width?: number;
    height?: number;
    fill?: string;
  }
  
  export const FourBoxIcon = ({ width = 24, height = 24, fill = "#333337" }: FourBoxIconProps) => {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="2" y="2" width="8" height="8" fill={fill} />
        <rect x="14" y="2" width="8" height="8" fill={fill} />
        <rect x="2" y="14" width="8" height="8" fill={fill} />
        <rect x="14" y="14" width="8" height="8" fill={fill} transform="rotate(-45 18 18)" />
      </svg>
    );
  };
  