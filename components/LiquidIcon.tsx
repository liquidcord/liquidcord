import { React } from "@webpack/common";

export function LiquidIcon(props: { width?: number; height?: number }) {
  const { width = 20, height = 20 } = props;
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3C12 3 6 10 6 15C6 18.3137 8.68629 21 12 21C15.3137 21 18 18.3137 18 15C18 10 12 3 12 3Z" fill="currentColor" />
      <circle cx="9" cy="13" r="1.5" fill="#0f0f10" />
    </svg>
  );
}
