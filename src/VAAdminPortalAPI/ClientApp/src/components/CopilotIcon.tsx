export const COPILOT_LOGO_SRC = '/images/microsoft-copilot.png';

/** Official Copilot logo served from wwwroot/images. Scales with the given font size. */
export default function CopilotIcon({
  className,
  fontSize = '1em',
}: {
  className?: string;
  fontSize?: string | number;
}) {
  return (
    <img
      className={className}
      src={COPILOT_LOGO_SRC}
      alt=""
      aria-hidden="true"
      style={{ width: fontSize, height: fontSize, display: 'block', objectFit: 'contain' }}
    />
  );
}
