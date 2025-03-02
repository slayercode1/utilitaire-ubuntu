import { SVGProps } from "react";

export const IconDefault = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="#5D5D5D" />
        <stop offset="100%" stopColor="#333" />
      </linearGradient>
      <linearGradient id="b" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="#fff" stopOpacity={0.2} />
        <stop offset="100%" stopColor="#fff" stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect width={150} height={150} x={25} y={25} fill="url(#a)" rx={35} />
    <rect width={150} height={75} x={25} y={25} fill="url(#b)" rx={35} />
    <circle cx={100} cy={85} r={40} fill="#fff" opacity={0.1} />
    <circle cx={130} cy={130} r={25} fill="#fff" opacity={0.1} />
    <rect width={20} height={20} x={62} y={72} fill="#fff" rx={5} />
    <rect width={20} height={20} x={90} y={72} fill="#fff" rx={5} />
    <rect width={20} height={20} x={118} y={72} fill="#fff" rx={5} />
    <rect width={20} height={20} x={62} y={100} fill="#fff" rx={5} />
    <rect width={20} height={20} x={90} y={100} fill="#fff" rx={5} />
    <rect width={20} height={20} x={118} y={100} fill="#fff" rx={5} />
    <rect width={20} height={20} x={62} y={128} fill="#fff" rx={5} />
    <rect width={20} height={20} x={90} y={128} fill="#fff" rx={5} />
    <rect width={20} height={20} x={118} y={128} fill="#fff" rx={5} />
    <circle cx={35} cy={40} r={5} fill="#fff" opacity={0.6} />
    <circle cx={50} cy={35} r={3} fill="#fff" opacity={0.6} />
  </svg>
  );
}