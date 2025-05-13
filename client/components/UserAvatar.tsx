import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UserAvatarProps {
  photoURL?: string | null;
  displayName?: string;
  size?: number;
  style?: object;
}

const getInitials = (name?: string): string => {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  } else {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
};

const getRandomColor = (name?: string): string => {
  if (!name) return '#007AFF';
  
  // Generate a consistent color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use a set of nice, muted colors
  const colors = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
    '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
    '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#f39c12',
    '#d35400', '#c0392b', '#7f8c8d'
  ];
  
  // Get a positive index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  photoURL, 
  displayName = 'User', 
  size = 40,
  style = {} 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Reset error state if photoURL changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [photoURL]);
  
  // Styles for different-sized avatars
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...style
  };
  
  const textStyle = {
    fontSize: size * 0.4,
  };

  // If there's a valid photo URL and no error loading it
  if (photoURL && !imageError) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: photoURL }}
          style={{width: '100%', height: '100%', borderRadius: size / 2}}
          onLoadStart={() => setImageLoading(true)}
          onLoad={() => setImageLoading(false)}
          onError={(error) => {
            console.log('Avatar image failed to load:', photoURL);
            console.log('Error details:', error.nativeEvent);
            setImageError(true);
            setImageLoading(false);
          }}
        />
        {imageLoading && (
          <View style={[styles.loadingOverlay, {borderRadius: size / 2}]}>
            <Text style={[styles.text, {fontSize: size * 0.2}]}>Loading...</Text>
          </View>
        )}
      </View>
    );
  }

  // Text avatar with initials when no image is available
  if (displayName) {
    const initials = getInitials(displayName);
    const backgroundColor = getRandomColor(displayName);
    
    return (
      <View style={[containerStyle, styles.textContainer, { backgroundColor }]}>
        <Text style={[styles.text, textStyle]}>{initials}</Text>
      </View>
    );
  }
  
  // Fallback icon avatar
  return (
    <View style={[containerStyle, styles.iconContainer]}>
      <Ionicons name="person" size={size * 0.6} color="#fff" />
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UserAvatar; 