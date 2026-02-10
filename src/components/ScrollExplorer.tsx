import { useRef, useState, useEffect, useCallback } from 'react';

export default function ScrollExplorer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(-0.25);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scrollHeight = el.offsetHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    const scrolled = -rect.top;
    // Allow negative progress so animations start as user scrolls toward the section
    const p = Math.max(-0.25, Math.min(1, scrolled / scrollHeight));
    setProgress(p);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const ease = (t: number) => t * t * (3 - 2 * t);
  const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Cell image: visible early, fades to invisible as X-ray appears
  // At progress=-0.2: cell=0.4 (translucent), by progress~0: cell≈0.04 (nearly invisible)
  const cellFadeT = ease(clamp01((progress + 0.2) / 0.25));
  const cellOpacity = lerp(0.4, 0, cellFadeT);
  const cellScale = lerp(0.98, 1, clamp01((progress + 0.2) / 0.2));

  // X-ray: starts fading in from progress=-0.1, full by progress=0.05
  const xrayAppearT = ease(clamp01((progress + 0.1) / 0.15));
  const xrayOpacity = lerp(0.05, 1, xrayAppearT);
  const xrayScale = lerp(0.97, 1, xrayAppearT);

  // X-ray separates (0.05–0.35), "Buried interfaces" label
  const splitT = ease(clamp01((progress - 0.05) / 0.3));
  const splitDistance = lerp(0, 15, splitT);
  const labelOpacity = ease(clamp01((progress - 0.1) / 0.12)) * (1 - ease(clamp01((progress - 0.4) / 0.12)));

  // X-ray fades to low translucency (0.35–0.6)
  const xrayFadeT = ease(clamp01((progress - 0.35) / 0.25));
  const xrayFinalOpacity = lerp(xrayOpacity, 0.07, xrayFadeT);

  // Neutron fades in (0.38–0.73)
  const neutronT = ease(clamp01((progress - 0.38) / 0.35));
  const neutronOpacity = lerp(0.03, 1, neutronT);
  const neutronScale = lerp(0.97, 1, neutronT);

  // Neutron label
  const neutronLabelOpacity = ease(clamp01((progress - 0.6) / 0.15));

  // Beam glows
  const xrayGlow = xrayFinalOpacity * 0.18;
  const neutronGlow = neutronOpacity * 0.15;

  // Stage: 3 stages — cell active when progress < 0.05
  const stage = progress < 0.05 ? 0 : progress < 0.5 ? 1 : 2;
  const labels = ['Fuel cell', 'X-ray tomography', 'Neutron tomography'];

  return (
    <div ref={containerRef} className="se-container" style={{ height: '350vh' }}>
      <div className="se-sticky">
        <div className="se-viewport">
          {/* Beam glows */}
          <div className="se-beam se-beam-xray" style={{ opacity: xrayGlow }} />
          <div className="se-beam se-beam-neutron" style={{ opacity: neutronGlow }} />

          {/* Cell image (fades out as X-ray appears) */}
          <img
            src="/images/cell-web.png"
            alt="Fuel cell"
            className="se-layer se-cell"
            style={{
              opacity: cellOpacity,
              transform: `scale(${cellScale})`,
            }}
          />

          {/* X-ray top */}
          <img
            src="/images/xray-top-web.png"
            alt="X-ray top view"
            className="se-layer se-xray-top"
            style={{
              opacity: xrayFinalOpacity,
              transform: `translateY(${-splitDistance}px) scale(${xrayScale})`,
            }}
          />

          {/* X-ray bottom */}
          <img
            src="/images/xray-bot-web.png"
            alt="X-ray bottom view"
            className="se-layer se-xray-bot"
            style={{
              opacity: xrayFinalOpacity,
              transform: `translateY(${splitDistance}px) scale(${xrayScale})`,
            }}
          />

          {/* Neutron */}
          <img
            src="/images/neutron-web.png"
            alt="Neutron tomography"
            className="se-layer se-neutron"
            style={{
              opacity: neutronOpacity,
              transform: `scale(${neutronScale})`,
            }}
          />
        </div>

        {/* Labels below the viewport */}
        <div
          className="se-buried-label"
          style={{ opacity: labelOpacity }}
        >
          <span className="se-buried-line" />
          <span className="se-buried-text">Buried interfaces</span>
          <span className="se-buried-line" />
        </div>
        <div
          className="se-buried-label"
          style={{ opacity: neutronLabelOpacity }}
        >
          <span className="se-buried-line" />
          <span className="se-buried-text">Internal phase maps</span>
          <span className="se-buried-line" />
        </div>

        {/* Stage indicators */}
        <div className="se-indicators">
          {labels.map((label, i) => (
            <div key={i} className={`se-indicator ${i === stage ? 'active' : ''}`}>
              <span className="se-dot" />
              <span className="se-indicator-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
