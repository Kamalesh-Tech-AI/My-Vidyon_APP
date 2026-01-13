import { motion } from 'framer-motion';

export function MyVidyonLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
            {/* Animated Logo */}
            <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Outer Ring */}
                <motion.div
                    className="w-20 h-20 rounded-full border-4 border-primary/20"
                    animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
                    }}
                />

                {/* Inner Circle with Gradient */}
                <motion.div
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
                    animate={{
                        scale: [1, 0.9, 1],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    {/* MV Letters */}
                    <motion.span
                        className="text-white font-bold text-xl"
                        animate={{
                            opacity: [1, 0.7, 1],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        MV
                    </motion.span>
                </motion.div>

                {/* Spinning Dots */}
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-primary rounded-full"
                        style={{
                            top: '50%',
                            left: '50%',
                            marginTop: '-4px',
                            marginLeft: '-4px',
                        }}
                        animate={{
                            rotate: 360,
                            x: Math.cos((i * Math.PI) / 2) * 40,
                            y: Math.sin((i * Math.PI) / 2) * 40,
                        }}
                        transition={{
                            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                            x: { duration: 2, repeat: Infinity, ease: "linear" },
                            y: { duration: 2, repeat: Infinity, ease: "linear" },
                        }}
                    />
                ))}
            </motion.div>

            {/* Loading Text */}
            <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <motion.h3
                    className="text-lg font-semibold text-foreground mb-1"
                    animate={{
                        opacity: [1, 0.5, 1],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    MyVidyon
                </motion.h3>
                <motion.p
                    className="text-sm text-muted-foreground"
                    animate={{
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    Loading your dashboard...
                </motion.p>
            </motion.div>

            {/* Progress Bar */}
            <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary"
                    animate={{
                        x: ['-100%', '100%'],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>
        </div>
    );
}

// Compact version for smaller spaces
export function MyVidyonLoaderCompact() {
    return (
        <div className="flex items-center justify-center gap-3 py-8">
            <motion.div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
                animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
                }}
            >
                <span className="text-white font-bold text-xs">MV</span>
            </motion.div>
            <motion.span
                className="text-sm text-muted-foreground font-medium"
                animate={{
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                Loading...
            </motion.span>
        </div>
    );
}
