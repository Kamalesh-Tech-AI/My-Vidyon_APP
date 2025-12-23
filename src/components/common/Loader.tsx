import React from 'react';

const Loader = ({ fullScreen = true }) => {
    const containerClasses = fullScreen
        ? "fixed inset-0 bg-[#FEF3E2] flex items-center justify-center z-50"
        : "flex items-center justify-center p-4";

    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-4 opacity-0" style={{ animation: 'fadeIn 0.3s ease-in forwards' }}>
                <div className="flex flex-wrap justify-center gap-2 max-w-[90vw]">
                    {/* Hidden SVG for gradient definition */}
                    <svg height={0} width={0} viewBox="0 0 64 64" className="absolute">
                        <defs>
                            <linearGradient gradientUnits="userSpaceOnUse" y2={2} x2={0} y1={62} x1={0} id="loader-gradient">
                                <stop stopColor="#FAB12F" />
                                <stop stopColor="#FA812F" offset={0.5} />
                                <stop stopColor="#DD0303" offset={1} />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Letter M */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 64 64"
                        height={128}
                        width={128}
                        className="inline-block opacity-0"
                        style={{ animation: 'slideUp 0.3s ease-out 0.1s forwards' }}
                    >
                        <path
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth={8}
                            stroke="url(#loader-gradient)"
                            d="M 10,60 V 4 L 32,32 L 54,4 V 60"
                            strokeDasharray="250"
                            strokeDashoffset="250"
                            style={{
                                animation: 'dash 2s ease-in-out infinite'
                            }}
                        />
                    </svg>

                    {/* Letter Y */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 64 64"
                        height={128}
                        width={128}
                        className="inline-block opacity-0"
                        style={{ animation: 'slideUp 0.3s ease-out 0.2s forwards' }}
                    >
                        <path
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth={8}
                            stroke="url(#loader-gradient)"
                            d="M 10,4 L 32,32 L 54,4 M 32,32 V 60"
                            strokeDasharray="140"
                            strokeDashoffset="140"
                            style={{
                                animation: 'dash 2s ease-in-out infinite 0.1s'
                            }}
                        />
                    </svg>

                    {/* Space */}
                    <div className="w-8 md:w-16" />

                    {/* Letter V */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 64 64"
                        height={128}
                        width={128}
                        className="inline-block opacity-0"
                        style={{ animation: 'slideUp 0.3s ease-out 0.4s forwards' }}
                    >
                        <path
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth={8}
                            stroke="url(#loader-gradient)"
                            d="M 10,4 L 32,60 L 54,4"
                            strokeDasharray="140"
                            strokeDashoffset="140"
                            style={{
                                animation: 'dash 2s ease-in-out infinite 0.3s'
                            }}
                        />
                    </svg>

                    {/* Letter I */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 64 64"
                        height={128}
                        width={128}
                        className="inline-block opacity-0"
                        style={{ animation: 'slideUp 0.3s ease-out 0.5s forwards' }}
                    >
                        <path
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth={8}
                            stroke="url(#loader-gradient)"
                            d="M 32,4 V 60"
                            strokeDasharray="60"
                            strokeDashoffset="60"
                            style={{
                                animation: 'dash 2s ease-in-out infinite 0.4s'
                            }}
                        />
                    </svg>

                    {/* Letter D */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 64 64"
                        height={128}
                        width={128}
                        className="inline-block opacity-0"
                        style={{ animation: 'slideUp 0.3s ease-out 0.6s forwards' }}
                    >
                        <path
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth={8}
                            stroke="url(#loader-gradient)"
                            d="M 10,4 H 32 C 46,4 54,16 54,32 C 54,48 46,60 32,60 H 10 V 4"
                            strokeDasharray="220"
                            strokeDashoffset="220"
                            style={{
                                animation: 'dash 2s ease-in-out infinite 0.5s'
                            }}
                        />
                    </svg>

                    {/* Letter Y */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 64 64"
                        height={128}
                        width={128}
                        className="inline-block opacity-0"
                        style={{ animation: 'slideUp 0.3s ease-out 0.7s forwards' }}
                    >
                        <path
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth={8}
                            stroke="url(#loader-gradient)"
                            d="M 10,4 L 32,32 L 54,4 M 32,32 V 60"
                            strokeDasharray="140"
                            strokeDashoffset="140"
                            style={{
                                animation: 'dash 2s ease-in-out infinite 0.6s'
                            }}
                        />
                    </svg>

                    {/* Letter O */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 64 64"
                        height={128}
                        width={128}
                        className="inline-block opacity-0"
                        style={{ animation: 'slideUp 0.3s ease-out 0.8s forwards' }}
                    >
                        <ellipse
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth={8}
                            stroke="url(#loader-gradient)"
                            cx="32"
                            cy="32"
                            rx="22"
                            ry="28"
                            strokeDasharray="180"
                            strokeDashoffset="180"
                            style={{
                                animation: 'dash 2s ease-in-out infinite 0.7s'
                            }}
                        />
                    </svg>

                    {/* Letter N */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 64 64"
                        height={128}
                        width={128}
                        className="inline-block opacity-0"
                        style={{ animation: 'slideUp 0.3s ease-out 0.9s forwards' }}
                    >
                        <path
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth={8}
                            stroke="url(#loader-gradient)"
                            d="M 10,60 V 4 L 54,60 V 4"
                            strokeDasharray="250"
                            strokeDashoffset="250"
                            style={{
                                animation: 'dash 2s ease-in-out infinite 0.8s'
                            }}
                        />
                    </svg>
                </div>
            </div>

            <style>{`
        @keyframes dash {
          0% {
            stroke-dashoffset: var(--dash-length, 200);
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: calc(var(--dash-length, 200) * -1);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
};

export default Loader;
