import React, { useState } from 'react';
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
      <Image
        source={{ uri: photoURL }}
        style={containerStyle}
        onError={() => {
          console.log('Avatar image failed to load:', photoURL);
          setImageError(true);
        }}
      />
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
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UserAvatar; 