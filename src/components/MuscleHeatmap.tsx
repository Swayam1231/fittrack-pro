import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { 
  Path, 
  Circle, 
  Defs, 
  RadialGradient, 
  Stop, 
  G, 
  Rect,
  LinearGradient,
  Text as SvgText,
  Line
} from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  interpolate,
  withSequence,
  withDelay,
  useAnimatedStyle
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Workout } from '../services/firestore.service';
import exercisesData from '../data/exercises.json';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);

interface MuscleHeatmapProps {
  workouts: Workout[];
}

// 3D-stylized anatomical segments (Simplified but technical)
const MUSCLE_PATHS = {
  Head: "M50,10 A10,10 0 1,1 50,30 A10,10 0 1,1 50,10",
  Chest: "M35,45 Q50,40 65,45 L68,65 Q50,70 32,65 Z",
  Abs: "M35,70 Q50,70 65,70 L62,100 Q50,105 38,100 Z",
  Shoulders_L: "M22,42 Q30,35 38,45 L32,60 Q25,55 22,42",
  Shoulders_R: "M78,42 Q70,35 62,45 L68,60 Q75,55 78,42",
  Arms_L_Upper: "M18,45 L25,45 L28,85 L15,85 Z",
  Arms_R_Upper: "M82,45 L75,45 L72,85 L85,85 Z",
  Arms_L_Lower: "M15,88 L28,88 L32,130 L10,130 Z",
  Arms_R_Lower: "M85,88 L72,88 L68,130 L90,130 Z",
  Quads_L: "M32,110 L48,110 L45,160 L28,160 Z",
  Quads_R: "M68,110 L52,110 L55,160 L72,160 Z",
  Hamstrings_L: "M32,110 L48,110 L45,160 L28,160 Z", // Simplified
  Hamstrings_R: "M68,110 L52,110 L55,160 L72,160 Z",
};

export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({ workouts }) => {
  const { colors, theme } = useTheme();
  const scanPos = useSharedValue(0);
  const breath = useSharedValue(1);

  useEffect(() => {
    scanPos.value = withRepeat(withTiming(1, { duration: 4000 }), -1, true);
    breath.value = withRepeat(withSequence(withTiming(1.2, { duration: 1500 }), withTiming(1, { duration: 1500 })), -1, true);
  }, []);

  // 1. Calculate muscle usage (Last 7 days or all workouts provided)
  const muscleIntensity: Record<string, number> = {
    Chest: 0,
    Back: 0,
    Legs: 0,
    Shoulders: 0,
    Arms: 0,
    Core: 0,
  };

  const exerciseToBodyPart: Record<string, string> = {};
  (exercisesData as any[]).forEach(ex => {
    exerciseToBodyPart[ex.name] = ex.bodyPart;
  });

  workouts.forEach(w => {
    w.exercises?.forEach(ex => {
      const part = exerciseToBodyPart[ex.name];
      if (part) {
        if (part === "Chest") muscleIntensity.Chest += 0.25;
        else if (part === "Abs" || part === "Core") muscleIntensity.Core += 0.25;
        else if (part.includes("Shoulders")) muscleIntensity.Shoulders += 0.25;
        else if (part.includes("Legs") || ["Quads", "Hamstrings", "Glutes"].includes(part)) muscleIntensity.Legs += 0.2;
        else if (["Arms", "Biceps", "Triceps"].includes(part)) muscleIntensity.Arms += 0.2;
      }
    });
  });

  // Clamp values to [0, 1]
  Object.keys(muscleIntensity).forEach(key => {
    muscleIntensity[key] = Math.min(muscleIntensity[key], 1);
  });

  const animatedScanStyle = useAnimatedStyle(() => ({
    top: interpolate(scanPos.value, [0, 1], [0, 180]),
  }));

  const getIntensityColor = (score: number) => {
    if (score === 0) return 'rgba(255, 255, 255, 0.05)';
    // Light fatigue (#a3a6ff) to Maximum Strain (#ff6e84)
    if (score > 0.8) return '#ff6e84';
    if (score > 0.4) return '#c180ff';
    return '#a3a6ff';
  };

  const isRecovery = (score: number) => score > 0 && score < 0.3;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.glassPanel}>
        <View style={styles.header}>
          <View style={styles.liveIndicator}>
            <View style={[styles.pulseDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.liveText}>BIOMETRIC TELEMETRY ACTIVE</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Performance Heatmap</Text>
        </View>

        <View style={styles.heatmapWrapper}>
          <Svg width="180" height="220" viewBox="0 0 100 200">
            <Defs>
              <RadialGradient id="glowPrimary" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#a3a6ff" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#a3a6ff" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="glowStrain" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#ff6e84" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#ff6e84" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="glowRecovery" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#9bffce" stopOpacity="0.4" />
                <Stop offset="100%" stopColor="#9bffce" stopOpacity="0" />
              </RadialGradient>
              
              <LinearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#9bffce" stopOpacity="0" />
                <Stop offset="100%" stopColor="#9bffce" stopOpacity="0.5" />
              </LinearGradient>
            </Defs>

            {/* Silhouette Outline */}
            <G opacity={0.3} stroke="#a3a6ff" strokeWidth="0.5" fill="none">
               <Path d="M50,10 A10,10 0 1,1 50,30 A10,10 0 1,1 50,10" /> {/* Head */}
               <Path d="M30,35 Q50,30 70,35 L75,80 Q50,90 25,80 Z" /> {/* Torso */}
               <Path d="M30,35 Q15,50 20,80" /> {/* Arm L */}
               <Path d="M70,35 Q85,50 80,80" /> {/* Arm R */}
            </G>

            {/* Muscles with Internal Radiant Glow */}
            <MuscleGroup 
              id="Chest" 
              path={MUSCLE_PATHS.Chest} 
              intensity={muscleIntensity.Chest} 
              color={getIntensityColor(muscleIntensity.Chest)} 
              recovery={isRecovery(muscleIntensity.Chest)}
              breath={breath}
            />
            <MuscleGroup 
              id="Core" 
              path={MUSCLE_PATHS.Abs} 
              intensity={muscleIntensity.Core} 
              color={getIntensityColor(muscleIntensity.Core)} 
              recovery={isRecovery(muscleIntensity.Core)}
              breath={breath}
            />
            <MuscleGroup 
              id="Shoulder_L" 
              path={MUSCLE_PATHS.Shoulders_L} 
              intensity={muscleIntensity.Shoulders} 
              color={getIntensityColor(muscleIntensity.Shoulders)} 
              recovery={isRecovery(muscleIntensity.Shoulders)}
              breath={breath}
            />
            <MuscleGroup 
              id="Shoulder_R" 
              path={MUSCLE_PATHS.Shoulders_R} 
              intensity={muscleIntensity.Shoulders} 
              color={getIntensityColor(muscleIntensity.Shoulders)} 
              recovery={isRecovery(muscleIntensity.Shoulders)}
              breath={breath}
            />
            <MuscleGroup 
              id="Legs_L" 
              path={MUSCLE_PATHS.Quads_L} 
              intensity={muscleIntensity.Legs} 
              color={getIntensityColor(muscleIntensity.Legs)} 
              recovery={isRecovery(muscleIntensity.Legs)}
              breath={breath}
            />
            <MuscleGroup 
              id="Legs_R" 
              path={MUSCLE_PATHS.Quads_R} 
              intensity={muscleIntensity.Legs} 
              color={getIntensityColor(muscleIntensity.Legs)} 
              recovery={isRecovery(muscleIntensity.Legs)}
              breath={breath}
            />

            {/* Metadata Labels */}
            {muscleIntensity.Chest > 0.6 ? (
              <G>
                <Line x1="45" y1="55" x2="10" y2="40" stroke="#ff6e84" strokeWidth="0.5" />
                <SvgText 
                  x="5" 
                  y="35" 
                  fill="#ff6e84" 
                  fontSize="8" 
                  fontWeight="700" 
                  fontFamily="SpaceGrotesk-Bold"
                >
                  {`CHEST: ${(muscleIntensity.Chest * 100).toFixed(0)}% STRAIN`}
                </SvgText>
              </G>
            ) : null}
            {muscleIntensity.Legs > 0.6 ? (
              <G>
                <Line x1="40" y1="135" x2="5" y2="150" stroke="#ff6e84" strokeWidth="0.5" />
                <SvgText 
                  x="5" 
                  y="160" 
                  fill="#ff6e84" 
                  fontSize="8" 
                  fontWeight="700" 
                  fontFamily="SpaceGrotesk-Bold"
                >
                  {`QUADS: ${(muscleIntensity.Legs * 100).toFixed(0)}% STRAIN`}
                </SvgText>
              </G>
            ) : null}
          </Svg>

          {/* Biometric Scan Line */}
          <Animated.View style={[styles.scanLine, animatedScanStyle]} />
        </View>

        <View style={styles.legend}>
           <View style={styles.legendItem}>
             <View style={[styles.legendDot, { backgroundColor: '#ff6e84' }]} />
             <Text style={styles.legendText}>MAX STRAIN</Text>
           </View>
           <View style={styles.legendItem}>
             <View style={[styles.legendDot, { backgroundColor: '#a3a6ff' }]} />
             <Text style={styles.legendText}>ACTIVE</Text>
           </View>
           <View style={styles.legendItem}>
             <View style={[styles.legendDot, { backgroundColor: '#9bffce' }]} />
             <Text style={[styles.legendText, { color: '#9bffce' }]}>RECOVERY</Text>
           </View>
        </View>
      </View>
    </View>
  );
};

const MuscleGroup = ({ id, path, intensity, color, recovery, breath }: any) => {
  const animatedProps = useAnimatedProps(() => {
    return {
      opacity: recovery ? interpolate(breath.value, [1, 1.2], [0.4, 0.8]) : 1,
    };
  });

  return (
    <G>
      <Path 
        d={path} 
        fill={recovery ? "#9bffce" : color} 
        opacity={intensity > 0 ? 0.8 : 0.05} 
      />
      {intensity > 0.5 ? (
        <Circle cx="50" cy="50" r="20" fill={intensity > 0.8 ? "url(#glowStrain)" : "url(#glowPrimary)"} />
      ) : null}
      {recovery ? (
        <AnimatedPath d={path} fill="url(#glowRecovery)" animatedProps={animatedProps} />
      ) : null}
    </G>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 32,
    marginVertical: 10,
  },
  glassPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    marginBottom: 20,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    color: '#ff6e84',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  heatmapWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 220,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#9bffce',
    borderRadius: 100,
    shadowColor: '#9bffce',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
    opacity: 0.6,
  },
  ambientGlow: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '50%',
    height: '50%',
    backgroundColor: 'rgba(163, 166, 255, 0.1)',
    borderRadius: 100,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
  },
});
