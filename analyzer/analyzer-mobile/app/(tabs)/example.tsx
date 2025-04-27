import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
// Remove VideoContext import
// import { useVideo, VideoData } from '../../context/VideoContext'; 
import { VideoData } from '../../context/VideoContext'; // Keep VideoData type import if defined there
import { Video, ResizeMode } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import KeyMomentsDisplay from '../../components/KeyMomentsDisplay';
// Remove useLocalSearchParams import
// import { useLocalSearchParams } from 'expo-router';

// Keep Backend URL
const BACKEND_URL = 'http://192.168.8.143:5000'; // Ensure this is correct

export default function ExampleScreen() { // Rename component
  // Remove params and isExampleMode
  // const params = useLocalSearchParams();
  // const isExampleMode = params.loadExample === 'true';

  // State for example data
  const [exampleVideo1, setExampleVideo1] = useState<VideoData | null>(null);
  const [exampleVideo2, setExampleVideo2] = useState<VideoData | null>(null);
  const [isLoadingExample, setIsLoadingExample] = useState(true); // Start loading initially
  const [exampleError, setExampleError] = useState<string | null>(null);

  // Remove context data
  // const { firstVideo: contextVideo1, secondVideo: contextVideo2 } = useVideo();
  
  const [activeTab, setActiveTab] = useState<'videos' | 'moments'>('videos');

  // Fetch example data on mount
  useEffect(() => {
    // Remove outer if (isExampleMode) condition
    const fetchExampleData = async () => {
      // Keep setIsLoadingExample(true); setExampleError(null); etc.
      setIsLoadingExample(true);
      setExampleError(null);
      setExampleVideo1(null);
      setExampleVideo2(null);
      console.log(`Fetching example data from ${BACKEND_URL}...`);

      try {
        const moments1Promise = fetch(`${BACKEND_URL}/api/moments/example_khanh_pose.mp4`);
        const moments2Promise = fetch(`${BACKEND_URL}/api/moments/example_quan_pose.mp4`);

        const [moments1Response, moments2Response] = await Promise.all([moments1Promise, moments2Promise]);

        if (!moments1Response.ok || !moments2Response.ok) {
          throw new Error('Failed to fetch example moments data');
        }

        const moments1 = await moments1Response.json();
        const moments2 = await moments2Response.json();

        // Construct example video data objects (Keep this part)
        const exVideo1: VideoData = {
          uri: `${BACKEND_URL}/api/video/example_khanh_pose.mp4`,
          processedUri: `${BACKEND_URL}/api/video/example_khanh_pose.mp4`,
          label: 'Example 1 (Khanh)',
          moments: moments1,
        };
        const exVideo2: VideoData = {
          uri: `${BACKEND_URL}/api/video/example_quan_pose.mp4`,
          processedUri: `${BACKEND_URL}/api/video/example_quan_pose.mp4`,
          label: 'Example 2 (Quan)',
          moments: moments2,
        };
        
        console.log("Example Video 1 Data:", exVideo1);
        console.log("Example Video 2 Data:", exVideo2);

        setExampleVideo1(exVideo1);
        setExampleVideo2(exVideo2);

      } catch (error: any) {
        console.error("Error fetching example data:", error);
        setExampleError(error.message || 'Failed to load example data.');
      } finally {
        setIsLoadingExample(false);
      }
    };

    fetchExampleData();
    // Remove dependency array or keep it empty
  }, []); 

  // Determine which video data to use - always use example state now
  const video1 = exampleVideo1;
  const video2 = exampleVideo2;

  // Loading state specific to example mode
  if (isLoadingExample) { // Use isLoadingExample directly
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.emptyText}>Loading Example...</Text>
      </View>
    );
  }

  // Error state specific to example mode
  if (exampleError) { // Use exampleError directly
     return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="error-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>Error Loading Example</Text>
        <Text style={styles.errorSubText}>{exampleError}</Text>
      </View>
    );
  }

  // Show empty state if no videos are available AFTER loading/error checks
  if (!video1 || !video2) {
    // Simplified empty state for example screen
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="videocam-off" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Example data not found.</Text>
        <Text style={styles.emptySubText}>Ensure the backend is running and example files exist.</Text>
      </View>
    );
  }
  
  // --- Rendering Logic --- (Uses video1 and video2 from example state)

  const renderVideoSection = () => {
    // No need for null check here due to the check above
    return (
      <View style={styles.videoSection}>
        <View style={styles.videoContainer}>
          <Text style={styles.videoLabel}>{video1!.label || 'Video 1'}</Text> 
          <Video
            source={{ uri: video1!.uri }} // Use uri directly from example data
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            shouldPlay={false}
            isLooping={false}
          />
        </View>

        <View style={styles.videoContainer}>
          <Text style={styles.videoLabel}>{video2!.label || 'Video 2'}</Text>
          <Video
            source={{ uri: video2!.uri }} // Use uri directly from example data
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            useNativeControls
            shouldPlay={false}
            isLooping={false}
          />
        </View>
      </View>
    );
  };

  const renderMomentsSection = () => {
    // Null check done above, check moments specifically
    if (!video1!.moments || !video2!.moments || video1!.moments.length === 0 || video2!.moments.length === 0) {
       return (
        <View style={styles.emptyMomentsContainer}>
          <Text style={styles.emptyMomentsText}>No key moments data found for examples</Text>
          <Text style={styles.emptyMomentsSubText}>Check backend connection and moments files.</Text>
        </View>
      );
    }

    return (
      <KeyMomentsDisplay 
        video1={video1!} // Use non-null assertion or ensure type safety
        video2={video2!} // Use non-null assertion or ensure type safety
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {/* Tab buttons remain the same */}
         <TouchableOpacity 
          style={[styles.tab, activeTab === 'videos' && styles.activeTab]} 
          onPress={() => setActiveTab('videos')}
        >
          <MaterialIcons 
            name="videocam" 
            size={24} 
            color={activeTab === 'videos' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
            Videos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'moments' && styles.activeTab]} 
          onPress={() => setActiveTab('moments')}
        >
          <MaterialIcons 
            name="timeline" 
            size={24} 
            color={activeTab === 'moments' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'moments' && styles.activeTabText]}>
            Key Moments
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'videos' ? renderVideoSection() : renderMomentsSection()}
    </View>
  );
}

// Keep styles the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center', // Added for better centering
  },
  emptySubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F44336',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: 16,
    color: '#D32F2F',
    marginTop: 8,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  videoSection: {
    flex: 1,
  },
  videoContainer: {
    flex: 1, // Make videos share space
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative',
    minHeight: 250, // Give videos minimum height
  },
  video: {
    flex: 1, // Let video fill container
    backgroundColor: '#000',
  },
  videoLabel: {
    position: 'absolute',
    top: 10, // Adjusted position
    left: 10, // Adjusted position
    fontSize: 18, // Adjusted size
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  emptyMomentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyMomentsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center', // Added
  },
  emptyMomentsSubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  // Styles from original analysis.tsx that might not be needed if KeyMomentsDisplay handles everything
  // momentsContainer: { ... }, 
  // momentsSection: { ... },
  // momentsTitle: { ... },
  // momentItem: { ... },
  // momentHeader: { ... },
  // momentLabel: { ... },
}); 