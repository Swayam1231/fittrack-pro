import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
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
  FeMergeNode
} from 'react-native-svg';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  interpolate,
  withSequence,
  useAnimatedStyle,
  interpolateColor
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Workout } from '../services/firestore.service';
import exercisesData from '../data/exercises.json';
import { Ionicons } from "@expo/vector-icons";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

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
  const { colors, theme } = useTheme();
  const [view, setView] = useState<'front' | 'back'>('front');
  const scanPos = useSharedValue(0);
  const breath = useSharedValue(1);

  useEffect(() => {
    scanPos.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true);
    breath.value = withRepeat(withSequence(withTiming(1.15, { duration: 2000 }), withTiming(1, { duration: 2000 })), -1, true);
  }, []);

  // Calculate muscle intensity with expanded groups
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
        else if (part === "Back") muscleIntensity.Back += 0.15;
        else if (part === "Abs" || part === "Core") muscleIntensity.Core += 0.2;
        else if (part.includes("Shoulders")) muscleIntensity.Shoulders += 0.15;
        else if (part === "Biceps") muscleIntensity.Biceps += 0.15;
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
    if (score > 0.7) return '#FF0055'; // Max Strain
    if (score > 0.3) return '#7000FF'; // Active
    return '#00F2FF'; // Recovery/Starting
  };

  const animatedScanStyle = useAnimatedStyle(() => ({
    top: interpolate(scanPos.value, [0, 1], [0, 200]),
    opacity: interpolate(scanPos.value, [0, 0.1, 0.9, 1], [0, 0.8, 0.8, 0]),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <View style={styles.telemetryBadge}>
             <View style={[styles.pulseDot, { backgroundColor: '#FF0055' }]} />
             <Text style={styles.telemetryText}>NEURAL SCAN ACTIVE</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
             {view === 'front' ? 'Anterior' : 'Posterior'} View
          </Text>
        </View>
        <Pressable 
          onPress={() => setView(v => v === 'front' ? 'back' : 'front')}
          style={[styles.toggleBtn, { backgroundColor: colors.surfaceContainerHigh }]}
        >
          <Ionicons name="refresh" size={18} color={colors.primary} />
          <Text style={[styles.toggleText, { color: colors.textPrimary }]}>FLIP</Text>
        </Pressable>
      </View>

      <View style={styles.heatmapWrapper}>
        <Svg width="240" height="260" viewBox="0 0 100 200">
          <Defs>
            <Filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
               <FeGaussianBlur stdDeviation="1.5" result="blur" />
               <FeMerge>
                 <FeMergeNode in="blur" />
                 <FeMergeNode in="SourceGraphic" />
               </FeMerge>
            </Filter>
            
            <RadialGradient id="gradStrain" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#FF0055" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#FF0055" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="gradActive" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#7000FF" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#7000FF" stopOpacity="0" />
            </RadialGradient>
            
            <LinearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#00F2FF" stopOpacity="0" />
              <Stop offset="50%" stopColor="#00F2FF" stopOpacity="1" />
              <Stop offset="100%" stopColor="#00F2FF" stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* Wireframe Silhouette */}
          <G opacity={0.15} stroke={colors.primary} strokeWidth="0.5" fill="none">
             <Path d="M50 15c-5 0-10 4-10 10s5 10 10 10 10-4 10-10-5-10-10-10z" /> {/* Head */}
             <Path d="M40 35c-10 2-15 10-15 25v40c0 10 5 15 10 18l5 50h20l5-50c5-3 10-8 10-18V60c0-15-5-23-15-25z" /> {/* Torso */}
             <Path d="M25 45c-5 3-10 10-10 25v30M75 45c5 3 10 10 10 25v30" /> {/* Arms */}
          </G>

          {view === 'front' ? (
            <G>
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
            <G>
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

          {/* Dynamic Labels for Top Strain */}
          {Object.entries(muscleIntensity)
            .filter(([_, v]) => v > 0.4)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([name, val], idx) => (
              <G key={name} transform={`translate(0, ${idx * 15})`}>
                <Line x1="10" y1="40" x2="30" y2="60" stroke={getIntensityColor(val)} strokeWidth="0.5" opacity={0.5} />
                <SvgText 
                  x="5" y="35" 
                  fill={getIntensityColor(val)} 
                  fontSize="6" 
                  fontFamily="SpaceGrotesk-Bold"
                >
                  {`${name.toUpperCase()} DATA: ${(val * 100).toFixed(0)}%`}
                </SvgText>
              </G>
            ))}
        </Svg>

        <Animated.View style={[styles.scanLine, animatedScanStyle]} />
        
        {/* Ambient Corner Data */}
        <View style={styles.cornerData}>
           <Text style={styles.cornerLabel}>CORE_TEMP</Text>
           <Text style={styles.cornerValue}>36.8°C</Text>
        </View>
      </View>

      <View style={styles.legend}>
         <LegendItem color="#FF0055" label="CRITICAL" />
         <LegendItem color="#7000FF" label="OPTIMIZED" />
         <LegendItem color="#00F2FF" label="RECOVERY" />
      </View>
    </View>
  );
};

const MuscleGroup = ({ path, intensity, color, breath }: any) => {
  const animatedProps = useAnimatedProps(() => ({
    opacity: intensity > 0.1 ? interpolate(breath.value, [1, 1.15], [0.6, 1]) : 0.05,
    fill: intensity > 0.1 ? color : 'rgba(255,255,255,0.02)'
  }));

  return (
    <G filter="url(#glowFilter)">
      <AnimatedPath 
        d={path} 
        animatedProps={animatedProps}
      />
      {intensity > 0.7 && (
        <Circle cx="50" cy="100" r="100" fill="url(#gradStrain)" opacity={0.2} />
      )}
    </G>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  telemetryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  telemetryText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#FF0055',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  heatmapWrapper: {
    alignItems: 'center',
    position: 'relative',
    height: 260,
    justifyContent: 'center',
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#00F2FF',
    shadowColor: '#00F2FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  cornerData: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'flex-end',
  },
  cornerLabel: {
    fontSize: 7,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '800',
  },
  cornerValue: {
    fontSize: 10,
    color: '#00F2FF',
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  legendLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
});
