import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { Workout } from '../services/firestore.service';
import exercisesData from '../data/exercises.json';

interface MuscleHeatmapProps {
  workouts: Workout[];
}

export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({ workouts }) => {
  const { colors } = useTheme();
  
  // 1. Calculate muscle usage
  const muscleCounts: Record<string, number> = {
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
        if (["Chest", "Back", "Shoulders", "Core"].includes(part)) {
          muscleCounts[part]++;
        } else if (part.includes("Legs") || part === "Quads" || part === "Hamstrings" || part === "Glutes") {
          muscleCounts.Legs++;
        } else if (part === "Arms" || part === "Biceps" || part === "Triceps") {
          muscleCounts.Arms++;
        }
      }
    });
  });

  const maxCount = Math.max(...Object.values(muscleCounts), 1);
  
  const getColor = (part: string) => {
    const intensity = muscleCounts[part] / maxCount;
    if (muscleCounts[part] === 0) return colors.surface;
    // Blend from surface to primary
    return intensity > 0.7 ? colors.primary : intensity > 0.4 ? `${colors.primary}99` : `${colors.primary}44`;
  };

  return (
    <View style={{ alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 20 }}>Muscle Activity</Text>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 40 }}>
          {/* Human Silhouette - Front */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 10, fontWeight: '600' }}>Front</Text>
            <Svg width="120" height="200" viewBox="0 0 100 180">
                {/* Head */}
                <Rect x="40" y="0" width="20" height="20" rx="10" fill={colors.surface} />
                {/* Shoulders */}
                <Rect x="25" y="25" width="50" height="15" rx="5" fill={getColor('Shoulders')} />
                {/* Chest */}
                <Rect x="30" y="42" width="40" height="25" rx="5" fill={getColor('Chest')} />
                {/* Arms */}
                <Rect x="15" y="25" width="10" height="60" rx="5" fill={getColor('Arms')} />
                <Rect x="75" y="25" width="10" height="60" rx="5" fill={getColor('Arms')} />
                {/* Core */}
                <Rect x="35" y="70" width="30" height="30" rx="5" fill={getColor('Core')} />
                {/* Legs */}
                <Rect x="30" y="105" width="18" height="70" rx="5" fill={getColor('Legs')} />
                <Rect x="52" y="105" width="18" height="70" rx="5" fill={getColor('Legs')} />
            </Svg>
          </View>

          {/* Legend */}
          <View style={{ gap: 8 }}>
             {Object.keys(muscleCounts).map(muscle => (
                 <View key={muscle} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: getColor(muscle) }} />
                    <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: '500' }}>{muscle}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{muscleCounts[muscle]}</Text>
                 </View>
             ))}
          </View>
      </View>
    </View>
  );
};
