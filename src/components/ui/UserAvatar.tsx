import React, { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/src/hooks/useTheme';
import { AppText, Font } from '@/src/components/ui/AppText';

interface UserAvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

export function avatarInitials(name?: string | null) {
  return (name || 'M')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({ uri, name, size = 72 }: UserAvatarProps) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = !!uri && failed !== uri;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          onError={() => setFailed(uri)}
        />
      ) : (
        <AppText style={{ fontFamily: Font.bold, fontSize: size * 0.36, color: colors.primary }}>
          {avatarInitials(name)}
        </AppText>
      )}
    </View>
  );
}
