import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { 
  Path, 
  Circle, 
  Defs, 
  RadialGradient, 
  Stop, 
  G, 
  LinearGradient,
  Text as SvgText,
  Line,
  Filter,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
  Rect
} from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  interpolate,
  withSequence,
  useAnimatedStyle,
  withDelay
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Workout } from '../services/firestore.service';
import exercisesData from '../data/exercises.json';
import { Ionicons } from "@expo/vector-icons";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MuscleHeatmapProps {
  workouts: Workout[];
}

// High-fidelity anatomical paths (Human Front)
const FRONT_PATHS = {
  Head: "M50 15c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z",
  Chest_L: "M50 45c-2 0-8 2-12 4-4 2-5 8-5 12 0 4 2 6 5 6s8-2 12-2V45z",
  Chest_R: "M50 45c2 0 8 2 12 4 4 2 5 8 5 12 0 4-2 6-5 6s-8-2-12-2V45z",
  Abs_Upper: "M40 68h20v8H40zM40 78h20v8H40z",
  Abs_Lower: "M41 88h18l-2 15h-14z",
  Shoulder_L: "M32 46c-3-1-8 2-9 6-1 4 0 9 4 10 3 1 5-3 5-3V46z",
  Shoulder_R: "M68 46c3-1 8 2 9 6 1 4 0 9-4 10-3 1-5-3-5-3V46z",
  Biceps_L: "M22 55c-1 3-2 10-2 15s1 8 3 8 4-2 4-5V55z",
  Biceps_R: "M78 55c1 3 2 10 2 15s-1 8-3 8-4-2-4-5V55z",
  Forearms_L: "M18 75c-1 5-2 12-1 18s3 10 5 10 3-4 3-8V75z",
  Forearms_R: "M82 75c1 5 2 12 1 18s-3 10-5 10-3-4-3-8V75z",
  Quads_L: "M33 110c-3 5-5 15-5 25s2 20 4 25h15l2-50H33z",
  Quads_R: "M67 110c3 5 5 15 5 25s-2 20-4 25H53l-2-50H67z",
};

// High-fidelity anatomical paths (Human Back)
const BACK_PATHS = {
  Traps: "M38 35c4-2 8-3 12-3s8 1 12 3l3 8H35l3-8z",
  Lats_L: "M48 45c-4 0-10 4-13 8-3 4-4 12-3 18 1 4 4 6 8 6s8-2 8-2V45z",
  Lats_R: "M52 45c4 0 10 4 13 8 3 4 4 12 3 18-1 4-4 6-8 6s-8-2-8-2V45z",
  Triceps_L: "M20 52c-1 4-2 12-2 18s1 8 4 8 4-2 4-5V52z",
  Triceps_R: "M80 52c1 4 2 12 2 18s-1 8-4 8-4-2-4-5V52z",
  Glutes_L: "M34 95c-3 4-6 10-6 18s3 10 8 10h14V95H34z",
  Glutes_R: "M66 95c3 4 6 10 6 18s-3 10-8 10H50V95H66z",
  Hamstrings_L: "M30 125c-2 5-4 15-4 25s2 20 5 25h18l1-50H30z",
  Hamstrings_R: "M70 125c2 5 4 15 4 25s-2 20-5 25H52l-1-50H70z",
};

export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({ workouts }) => {
  const { colors } = useTheme();
  const [view, setView] = useState<'front' | 'back'>('front');
  const scanPos = useSharedValue(0);
  const breath = useSharedValue(1);
  const nodeOpacity = useSharedValue(0);

  useEffect(() => {
    scanPos.value = withRepeat(withTiming(1, { duration: 4000 }), -1, true);
    breath.value = withRepeat(withSequence(withTiming(1.15, { duration: 2500 }), withTiming(1, { duration: 2500 })), -1, true);
    nodeOpacity.value = withRepeat(withSequence(withTiming(1, { duration: 1000 }), withTiming(0.3, { duration: 1000 })), -1, true);
  }, []);

  const muscleIntensity: Record<string, number> = {
    Chest: 0, Back: 0, Core: 0, Shoulders: 0, Biceps: 0, Triceps: 0, Forearms: 0, Quads: 0, Hamstrings: 0, Glutes: 0,
  };

  const exerciseToBodyPart: Record<string, string> = {};
  (exercisesData as any[]).forEach(ex => {
    exerciseToBodyPart[ex.name] = ex.bodyPart;
  });

  workouts.forEach(w => {
    w.exercises?.forEach(ex => {
      const part = exerciseToBodyPart[ex.name];
      if (part) {
        if (part === "Chest") muscleIntensity.Chest += 0.15;
        else if (part === "Back" || part === "Upper Back" || part === "Lower Back") muscleIntensity.Back += 0.15;
        else if (part === "Abs" || part === "Core") muscleIntensity.Core += 0.2;
        else if (part.includes("Shoulders")) muscleIntensity.Shoulders += 0.15;
        else if (["Biceps", "Arms"].includes(part)) muscleIntensity.Biceps += 0.15;
        else if (part === "Triceps") muscleIntensity.Triceps += 0.15;
        else if (part === "Forearms") muscleIntensity.Forearms += 0.1;
        else if (part === "Quads") muscleIntensity.Quads += 0.15;
        else if (part === "Hamstrings") muscleIntensity.Hamstrings += 0.15;
        else if (part === "Glutes") muscleIntensity.Glutes += 0.15;
        else if (part === "Legs") {
            muscleIntensity.Quads += 0.1;
            muscleIntensity.Hamstrings += 0.1;
            muscleIntensity.Glutes += 0.05;
        }
      }
    });
  });

  Object.keys(muscleIntensity).forEach(key => {
    muscleIntensity[key] = Math.min(muscleIntensity[key], 1);
  });

  const getIntensityColor = (score: number) => {
    if (score === 0) return 'rgba(255, 255, 255, 0.03)';
    if (score > 0.75) return '#FF0055'; // Critical Strain (Coral Red)
    if (score > 0.4) return '#7000FF'; // Optimized Output (Royal Purple)
    return '#00F2FF'; // Biological Recovery (Neon Cyan)
  };

  const animatedScanStyle = useAnimatedStyle(() => ({
    top: interpolate(scanPos.value, [0, 1], [0, 240]),
    opacity: interpolate(scanPos.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
  }));

  const topStrains = Object.entries(muscleIntensity)
    .filter(([_, v]) => v > 0.1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Corner Accents */}
      <View style={styles.cornerTL} />
      <View style={styles.cornerBR} />

      <View style={styles.header}>
        <View>
          <View style={styles.statusRow}>
              <View style={[styles.pulseDot, { backgroundColor: '#FF0055' }]} />
              <Text style={styles.statusText}>BIOMETRIC OVERLAY v2.4.1</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
             {view === 'front' ? 'Anterior Kinematics' : 'Posterior Kinematics'}
          </Text>
        </View>
        <Pressable 
          onPress={() => setView(v => v === 'front' ? 'back' : 'front')}
          style={styles.flipCircle}
        >
          <Ionicons name="swap-horizontal" size={20} color="#00F2FF" />
        </Pressable>
      </View>

      <View style={styles.heatmapWrapper}>
        <Svg width="260" height="280" viewBox="0 0 100 200">
          <Defs>
            <Filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
               <FeGaussianBlur stdDeviation="2.5" result="blur" />
               <FeMerge>
                 <FeMergeNode in="blur" />
                 <FeMergeNode in="SourceGraphic" />
               </FeMerge>
            </Filter>
            
            <LinearGradient id="scanBeam" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#00F2FF" stopOpacity="0" />
              <Stop offset="50%" stopColor="#00F2FF" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#00F2FF" stopOpacity="0" />
            </LinearGradient>

            <RadialGradient id="nodeGlow" cx="50%" cy="50%" rx="50%" ry="50%">
               <Stop offset="0%" stopColor="#00F2FF" stopOpacity="0.4" />
               <Stop offset="100%" stopColor="#00F2FF" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Blueprint Grid */}
          <G opacity={0.05} stroke={colors.primary} strokeWidth="0.2">
             {Array.from({length: 11}).map((_, i) => (
                <Line key={`h-${i}`} x1="0" y1={i * 20} x2="100" y2={i * 20} />
             ))}
             {Array.from({length: 6}).map((_, i) => (
                <Line key={`v-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="200" />
             ))}
          </G>

          {/* Skeleton Framework */}
          <G opacity={0.2} stroke="#fff" strokeWidth="0.5" fill="none">
             <Path d="M50 20v80M30 40h40M35 100h30l2 80M35 180" opacity={0.3} />
             <Circle cx="50" cy="23" r="10" />
             <Rect x="35" y="40" width="30" height="60" rx="5" />
          </G>

          {view === 'front' ? (
            <G filter="url(#softGlow)">
              <MuscleGroup path={FRONT_PATHS.Chest_L} intensity={muscleIntensity.Chest} color={getIntensityColor(muscleIntensity.Chest)} breath={breath} />
              <MuscleGroup path={FRONT_PATHS.Chest_R} intensity={muscleIntensity.Chest} color={getIntensityColor(muscleIntensity.Chest)} breath={breath} />
              <MuscleGroup path={FRONT_PATHS.Abs_Upper} intensity={muscleIntensity.Core} color={getIntensityColor(muscleIntensity.Core)} breath={breath} />
              <MuscleGroup path={FRONT_PATHS.Abs_Lower} intensity={muscleIntensity.Core} color={getIntensityColor(muscleIntensity.Core)} breath={breath} />
              <MuscleGroup path={FRONT_PATHS.Shoulder_L} intensity={muscleIntensity.Shoulders} color={getIntensityColor(muscleIntensity.Shoulders)} breath={breath} />
              <MuscleGroup path={FRONT_PATHS.Shoulder_R} intensity={muscleIntensity.Shoulders} color={getIntensityColor(muscleIntensity.Shoulders)} breath={breath} />
              <MuscleGroup path={FRONT_PATHS.Biceps_L} intensity={muscleIntensity.Biceps} color={getIntensityColor(muscleIntensity.Biceps)} breath={breath} />
              <MuscleGroup path={FRONT_PATHS.Biceps_R} intensity={muscleIntensity.Biceps} color={getIntensityColor(muscleIntensity.Biceps)} breath={breath} />
              <MuscleGroup path={FRONT_PATHS.Forearms_L} intensity={muscleIntensity.Forearms} color={getIntensityColor(muscleIntensity.Forearms)} breath={breath} />
              <MuscleGroup path={FRONT_PATHS.Forearms_R} intensity={muscleIntensity.Forearms} color={getIntensityColor(muscleIntensity.Forearms)} breath={breath} />
              <MuscleGroup path={FRONT_PATHS.Quads_L} intensity={muscleIntensity.Quads} color={getIntensityColor(muscleIntensity.Quads)} breath={breath} />
              <MuscleGroup path={FRONT_PATHS.Quads_R} intensity={muscleIntensity.Quads} color={getIntensityColor(muscleIntensity.Quads)} breath={breath} />
            </G>
          ) : (
            <G filter="url(#softGlow)">
              <MuscleGroup path={BACK_PATHS.Traps} intensity={muscleIntensity.Back} color={getIntensityColor(muscleIntensity.Back * 0.5)} breath={breath} />
              <MuscleGroup path={BACK_PATHS.Lats_L} intensity={muscleIntensity.Back} color={getIntensityColor(muscleIntensity.Back)} breath={breath} />
              <MuscleGroup path={BACK_PATHS.Lats_R} intensity={muscleIntensity.Back} color={getIntensityColor(muscleIntensity.Back)} breath={breath} />
              <MuscleGroup path={BACK_PATHS.Triceps_L} intensity={muscleIntensity.Triceps} color={getIntensityColor(muscleIntensity.Triceps)} breath={breath} />
              <MuscleGroup path={BACK_PATHS.Triceps_R} intensity={muscleIntensity.Triceps} color={getIntensityColor(muscleIntensity.Triceps)} breath={breath} />
              <MuscleGroup path={BACK_PATHS.Glutes_L} intensity={muscleIntensity.Glutes} color={getIntensityColor(muscleIntensity.Glutes)} breath={breath} />
              <MuscleGroup path={BACK_PATHS.Glutes_R} intensity={muscleIntensity.Glutes} color={getIntensityColor(muscleIntensity.Glutes)} breath={breath} />
              <MuscleGroup path={BACK_PATHS.Hamstrings_L} intensity={muscleIntensity.Hamstrings} color={getIntensityColor(muscleIntensity.Hamstrings)} breath={breath} />
              <MuscleGroup path={BACK_PATHS.Hamstrings_R} intensity={muscleIntensity.Hamstrings} color={getIntensityColor(muscleIntensity.Hamstrings)} breath={breath} />
            </G>
          )}

          {/* Data Callouts */}
          {topStrains.map(([name, val], idx) => {
             const yPos = 40 + idx * 25;
             return (
               <G key={name}>
                  <Line x1="10" y1={yPos} x2="35" y2={yPos} stroke={getIntensityColor(val)} strokeWidth="0.5" strokeDasharray="2,1" />
                  <Circle cx="10" cy={yPos} r="1.5" fill={getIntensityColor(val)} />
                  <SvgText 
                    x="5" y={yPos - 4} 
                    fill={getIntensityColor(val)} 
                    fontSize="5" 
                    fontWeight="900" 
                    fontFamily="SpaceGrotesk-Bold"
                  >
                    {`${name.toUpperCase()} DATA ACTIVE`}
                  </SvgText>
                  <SvgText 
                    x="5" y={yPos + 8} 
                    fill="#fff" 
                    fontSize="7" 
                    opacity={0.8}
                    fontFamily="SpaceGrotesk-Bold"
                  >
                    {`${(val * 100).toFixed(0)}% LOAD`}
                  </SvgText>
               </G>
             );
          })}

          {/* Floating Neural Nodes */}
          <G opacity={0.4}>
             <AnimatedCircle cx="20" cy="150" r="1" fill="#00F2FF" />
             <AnimatedCircle cx="80" cy="170" r="1" fill="#7000FF" />
             <AnimatedCircle cx="15" cy="40" r="1" fill="#FF0055" />
          </G>
        </Svg>

        <Animated.View style={[styles.scanLine, animatedScanStyle]}>
           <View style={styles.scanGlow} />
        </Animated.View>

        <View style={styles.telemetryOverlay}>
            <View style={styles.telemetryItem}>
                <Text style={styles.teleText}>LOAD_INDEX</Text>
                <Text style={styles.teleValue}>0.842</Text>
            </View>
            <View style={styles.telemetryItem}>
                <Text style={styles.teleText}>RECOVERY_WINDOW</Text>
                <Text style={styles.teleValue}>14h 22m</Text>
            </View>
        </View>
      </View>

      <View style={styles.legend}>
         <LegendItem color="#FF0055" label="MAX" />
         <LegendItem color="#7000FF" label="BALANCED" />
         <LegendItem color="#00F2FF" label="REST" />
      </View>
    </View>
  );
};

const MuscleGroup = ({ path, intensity, color, breath }: any) => {
  const animatedProps = useAnimatedProps(() => ({
    opacity: intensity > 0.05 ? interpolate(breath.value, [1, 1.15], [0.4, 0.9]) : 0.05,
    fill: intensity > 0.05 ? color : 'rgba(255,255,255,0.05)'
  }));

  return (
    <AnimatedPath 
      d={path} 
      animatedProps={animatedProps}
      stroke={intensity > 0.7 ? '#FF0055' : 'none'}
      strokeWidth={0.2}
    />
  );
};

const LegendItem = ({ color, label }: any) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 0,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(0,242,255,0.3)',
  },
  cornerBR: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(0,242,255,0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#FF0055',
    fontFamily: 'Manrope-Bold',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: 'SpaceGrotesk-Bold',
  },
  flipCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,242,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,242,255,0.2)',
  },
  heatmapWrapper: {
    alignItems: 'center',
    position: 'relative',
    height: 280,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#00F2FF',
    zIndex: 10,
  },
  scanGlow: {
    height: 40,
    backgroundColor: 'rgba(0,242,255,0.05)',
    width: '100%',
    position: 'absolute',
    top: -20,
  },
  telemetryOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    gap: 8,
  },
  telemetryItem: {
    alignItems: 'flex-end',
  },
  teleText: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  teleValue: {
    fontSize: 12,
    color: '#00F2FF',
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 4,
    borderRadius: 1,
  },
  legendLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
});
