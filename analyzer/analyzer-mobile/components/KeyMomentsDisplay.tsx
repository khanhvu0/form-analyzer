import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Dimensions 
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { formatTimestamp } from '../services/frameExtraction';

// Interface for key moment data
interface KeyMoment {
  frame: number;
  timestamp: number;
  label: string;
  confidence: number;
  [key: string]: any; // For any additional properties
}

interface KeyMomentsDisplayProps {
  video1: {
    uri: string;
    processedUri?: string;
    label?: string;
    moments?: KeyMoment[];
  } | null;
  video2: {
    uri: string;
    processedUri?: string;
    label?: string;
    moments?: KeyMoment[];
  } | null;
}

// Helper to find a moment by label
const findMomentByLabel = (label: string, moments: KeyMoment[] = []): KeyMoment | undefined => {
  return moments.find(moment => moment.label === label);
}

const KeyMomentsDisplay = ({ video1, video2 }: KeyMomentsDisplayProps) => {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  
  const video1Ref = useRef<Video>(null);
  const video2Ref = useRef<Video>(null);
  
  // Get all unique moment labels from both videos
  const allLabels = Array.from(new Set([
    ...(video1?.moments?.map(m => m.label) || []),
    ...(video2?.moments?.map(m => m.label) || [])
  ]));
  
  // Effect to seek videos when selectedLabel changes
  useEffect(() => {
    if (!selectedLabel) return;

    const moment1 = findMomentByLabel(selectedLabel, video1?.moments);
    const moment2 = findMomentByLabel(selectedLabel, video2?.moments);

    if (moment1 && video1Ref.current) {
      video1Ref.current.setPositionAsync(moment1.timestamp * 1000);
    }

    if (moment2 && video2Ref.current) {
      video2Ref.current.setPositionAsync(moment2.timestamp * 1000);
    }
    
  }, [selectedLabel, video1, video2]);
  
  return (
    <View style={styles.container}>
      <View style={styles.videoPlayersContainer}>
        {video1?.processedUri && (
          <View style={styles.videoWrapper}>
            <Text style={styles.videoTitle}>Video 1</Text>
            <Video
              ref={video1Ref}
              style={styles.video}
              source={{ uri: video1.processedUri }}
              useNativeControls
              resizeMode={ResizeMode.COVER}
              isLooping={false}
            />
          </View>
        )}
        {video2?.processedUri && (
          <View style={styles.videoWrapper}>
             <Text style={styles.videoTitle}>Video 2</Text>
            <Video
              ref={video2Ref}
              style={styles.video}
              source={{ uri: video2.processedUri }}
              useNativeControls
              resizeMode={ResizeMode.COVER}
              isLooping={false}
            />
          </View>
        )}
      </View>
      
      {/* Key Moment Buttons - Scrollable Horizontally or Wrap */}
      <View style={styles.keyMomentsContainer}> 
        <Text style={styles.keyMomentsTitle}>Key Moments</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keyMomentsScroll}>
          {allLabels.map((label) => {
             const isSelected = selectedLabel === label;
             return (
               <TouchableOpacity
                 key={label}
                 style={[styles.momentButton, isSelected && styles.selectedMomentButton]}
                 onPress={() => setSelectedLabel(label)}
               >
                 <Text style={[styles.momentButtonText, isSelected && styles.selectedMomentButtonText]}>
                   {label}
                 </Text>
               </TouchableOpacity>
             );
           })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  videoPlayersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  videoWrapper: {
    width: '48%',
    marginBottom: 10,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  video: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: 'black',
  },
  keyMomentsContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  keyMomentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  keyMomentsScroll: {
    flexDirection: 'row',
    paddingVertical: 5,
    alignItems: 'center', 
  },
  momentButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    alignItems: 'center',
  },
  selectedMomentButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  momentButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedMomentButtonText: {
    color: '#fff',
  },
});

export default KeyMomentsDisplay; 